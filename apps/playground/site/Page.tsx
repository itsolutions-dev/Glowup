import { useMemo } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import Head from "expo-router/head";
import { Typography, useTheme, type Theme } from "@its/glowup-ui";
import { useLayout } from "./breakpoints";
import { OG_IMAGE_URL } from "./siteNav";

const SITE_NAME = "Glowup";

interface PageProps {
  title: string;
  /** Meta description and the lead paragraph under the title. */
  description: string;
  /** Small uppercase line above the title. */
  eyebrow?: string;
  /** Rendered full-bleed between the header and the body. */
  banner?: React.ReactNode;
  children: React.ReactNode;
  /** Opt out of the scroll view for routes that manage their own panes. */
  scroll?: boolean;
}

/**
 * One page scaffold for every route: the document head, the title block, the
 * readable-width column and the side gutters.
 *
 * The gutter is set once here — as horizontal padding on a single wrapper —
 * because the previous screen set padding in four places and lost it at the
 * narrow breakpoint, which is how content ends up touching the edge of a phone.
 */
export const Page = ({
  title,
  description,
  eyebrow,
  banner,
  children,
  scroll = true,
}: PageProps) => {
  const { theme } = useTheme();
  const layout = useLayout();
  const styles = useMemo(() => makeStyles(theme), [theme]);

  const header = (
    <View style={styles.header}>
      {eyebrow ? (
        <Typography
          variant="labelSmall"
          style={[styles.eyebrow, { color: theme.colors.primary }]}
        >
          {eyebrow}
        </Typography>
      ) : null}
      <Typography
        variant={layout.isCompact ? "headlineSmall" : "headlineMedium"}
        style={{ color: theme.colors.onSurface }}
      >
        {title}
      </Typography>
      <Typography
        variant="bodyLarge"
        style={{ color: theme.colors.onSurfaceVariant }}
      >
        {description}
      </Typography>
    </View>
  );

  const body = (
    <View style={[styles.column, { maxWidth: layout.contentMaxWidth }]}>
      {header}
      {banner}
      {children}
    </View>
  );

  return (
    <>
      <PageHead title={title} description={description} />
      {scroll ? (
        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
        >
          {body}
        </ScrollView>
      ) : (
        <View style={styles.scroll}>{body}</View>
      )}
    </>
  );
};

/**
 * Per-route `<title>` and meta description. On web these end up in the
 * prerendered HTML of each static route, which is the whole reason the site is
 * exported as `static` rather than as a single-page bundle; on native the
 * component is a no-op.
 */
export const PageHead = ({
  title,
  description,
}: {
  title: string;
  description: string;
}) => {
  // The home page is titled "Glowup"; suffixing the site name there would
  // render "Glowup · Glowup" in the tab and in every share card.
  const documentTitle = title === SITE_NAME ? title : `${title} · ${SITE_NAME}`;

  return (
    <Head>
      <title>{documentTitle}</title>
      <meta name="description" content={description} />
      <meta property="og:title" content={documentTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:type" content="website" />
      <meta property="og:image" content={OG_IMAGE_URL} />
      <meta name="twitter:card" content="summary_large_image" />
    </Head>
  );
};

/** A titled block inside a page. */
export const Section = ({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) => {
  const { theme } = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);

  return (
    <View style={styles.section}>
      <Typography
        variant="titleLarge"
        style={{ color: theme.colors.onSurface }}
      >
        {title}
      </Typography>
      {description ? (
        <Typography
          variant="bodyMedium"
          style={{ color: theme.colors.onSurfaceVariant }}
        >
          {description}
        </Typography>
      ) : null}
      {children}
    </View>
  );
};

const makeStyles = (theme: Theme) =>
  StyleSheet.create({
    scroll: {
      flexGrow: 1,
      // The one place the side gutter is defined. `paddingBlock` keeps it from
      // being reset by a shorthand elsewhere.
      paddingHorizontal: theme.spacing.l,
      paddingTop: theme.spacing.l,
      paddingBottom: theme.spacing.xl * 2,
      alignItems: "center",
    },
    column: { width: "100%", gap: theme.spacing.xl },
    header: { gap: theme.spacing.xs, maxWidth: 720 },
    eyebrow: {
      textTransform: "uppercase",
      letterSpacing: 1.6,
      fontWeight: "700",
    },
    section: { gap: theme.spacing.m },
  });

export default Page;
