// The background location page's tasks must exist before anything renders:
// Android runs them headless and iOS relaunches the app for them, with no
// route mounted. Then the router's own entry.
import "./site/backgroundTasks";
import "expo-router/entry";
