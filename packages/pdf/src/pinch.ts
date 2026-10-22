import {
  Animated,
  PanResponder,
  type PanResponderInstance,
  type View,
} from "react-native";
import {
  GAP,
  MIN_ZOOM,
  clampZoom,
  holdFocus,
  keepFocus,
  liveScale,
  mapOffset,
  middle,
  span,
  type PageLayout,
} from "./zoom";

export type Point = { x: number; y: number };

/** What is needed to put the page back where the reader was looking once a new zoom is laid out. */
type PendingZoom = {
  focus: Point;
  ratio: number;
  from: PageLayout;
  scroll: Point;
};

/**
 * The two-finger gesture and the state it shares with the viewer. Its handlers are made once and have to read what the
 * viewer last rendered, so the viewer hands that over through `sync` after every render, and the rest goes in through
 * methods (an object like an `Animated.Value`, which is changed by calling it, not by assigning to it).
 *
 * While the fingers are down the page is scaled by `live`, about the point between them; when they lift,
 * `onZoom(zoom, focus)` asks the viewer for the zoom they led to and the viewer lays the pages out again at it.
 */
export class PinchController {
  /** The animated transform of the page area: scale, and the translation that holds the fingers' point still. */
  readonly live = {
    scale: new Animated.Value(1),
    x: new Animated.Value(0),
    y: new Animated.Value(0),
  };
  readonly responder: PanResponderInstance;

  /** The page area in the root view's coordinates (`measure`'s pageX and pageY) and its size (`onLayout`). */
  private box = { x: 0, y: 0, width: 0, height: 0 };
  /** The scroll offsets last seen, down the list and sideways. */
  private scrolled: Point = { x: 0, y: 0 };
  private body: View | null = null;
  private zoom = MIN_ZOOM;
  private layout: PageLayout = { offsets: [], lengths: [] };
  private pending: PendingZoom | null = null;
  private onActive: (active: boolean) => void = () => {};
  private onZoom: (zoom: number, focus: Point) => boolean = () => false;
  private start = { span: 1, zoom: MIN_ZOOM, scale: 1, mid: { x: 0, y: 0 } };

  constructor() {
    this.responder = PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      // Two fingers take the touch away from the lists; one finger goes on scrolling them. It is decided when
      // the second finger lands, not when the fingers move: by then the sideways list has begun to scroll under
      // them (on Android it follows the second finger) and the gesture is no longer ours.
      onStartShouldSetPanResponderCapture: (event) =>
        event.nativeEvent.touches.length >= 2,
      onMoveShouldSetPanResponderCapture: (event) =>
        event.nativeEvent.touches.length >= 2,
      onPanResponderTerminationRequest: () => false,
      onPanResponderGrant: (event) => {
        const [a, b] = event.nativeEvent.touches;
        this.start = {
          span: Math.max(1, span(a, b)),
          zoom: this.zoom,
          scale: 1,
          mid: middle(a, b),
        };
        // The fingers are in the root view's coordinates; so is what `measure` reports as pageX and pageY.
        this.body?.measure((_x, _y, _w, _h, pageX, pageY) => {
          this.box.x = pageX;
          this.box.y = pageY;
        });
        this.onActive(true);
      },
      onPanResponderMove: (event) => {
        const touches = event.nativeEvent.touches;
        if (touches.length < 2) return;
        const scale = liveScale(
          this.start.zoom,
          span(touches[0], touches[1]) / this.start.span,
        );
        this.start.scale = scale;
        this.start.mid = middle(touches[0], touches[1]);
        const focus = this.local(this.start.mid);
        this.live.scale.setValue(scale);
        this.live.x.setValue(holdFocus(focus.x, this.box.width / 2, scale));
        this.live.y.setValue(holdFocus(focus.y, this.box.height / 2, scale));
      },
      onPanResponderRelease: () => this.finish(),
      onPanResponderTerminate: () => this.finish(),
    });
  }

  /**
   * What the viewer rendered last: its zoom and the pages' layout, and the two ways to answer the fingers.
   * `onZoom` asks the viewer for a zoom with the point to hold still and says whether there was anything to change.
   */
  sync(
    zoom: number,
    layout: PageLayout,
    onActive: (active: boolean) => void,
    onZoom: (zoom: number, focus: Point) => boolean,
  ) {
    this.zoom = zoom;
    this.layout = layout;
    this.onActive = onActive;
    this.onZoom = onZoom;
  }

  attach(node: View | null) {
    this.body = node;
  }

  resize(width: number, height: number) {
    this.box.width = width;
    this.box.height = height;
  }

  scroll(axis: "x" | "y", offset: number) {
    this.scrolled[axis] = offset;
  }

  /** Notes what a zoom to `next` has to put back once it is laid out; returns the zoom to set, or null for no change. */
  plan(next: number, focus: Point): number | null {
    const from = this.zoom;
    const to = clampZoom(next);
    if (Math.abs(to - from) < 0.005) return null;
    this.pending = {
      focus,
      ratio: to / from,
      from: this.layout,
      // Zoomed out there is no sideways scroll: whatever it was last time is stale.
      scroll: {
        x: from > MIN_ZOOM ? this.scrolled.x : 0,
        y: this.scrolled.y,
      },
    };
    return to;
  }

  /**
   * Once the pages are laid out at the new zoom: drops the live transform, which the layout now stands for, and
   * returns where to scroll so that what was under the fingers still is (null when no zoom was asked for).
   */
  settle(layout: PageLayout): Point | null {
    this.resetLive();
    const p = this.pending;
    if (!p) return null;
    this.pending = null;
    return {
      x: keepFocus(p.scroll.x, p.focus.x, p.ratio),
      y: mapOffset(p.from, layout, GAP, p.scroll.y + p.focus.y) - p.focus.y,
    };
  }

  /** The middle of the page area: where the buttons zoom about. */
  center(): Point {
    return { x: this.box.width / 2, y: this.box.height / 2 };
  }

  resetLive() {
    this.live.scale.setValue(1);
    this.live.x.setValue(0);
    this.live.y.setValue(0);
  }

  private local(point: Point): Point {
    return { x: point.x - this.box.x, y: point.y - this.box.y };
  }

  private finish() {
    this.onActive(false);
    const { zoom, scale, mid } = this.start;
    if (!this.onZoom(zoom * scale, this.local(mid))) this.resetLive();
  }
}
