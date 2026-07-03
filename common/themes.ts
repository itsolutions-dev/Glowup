interface ThemeTypographyToken {
  fontFamily: string;
  fontSize: number;
  lineHeight: number;
  letterSpacing: number;
  fontWeight: "400" | "500" | "600" | "700";
}

interface Theme {
  colors: {
    primary: string;
    onPrimary: string;
    primaryContainer: string;
    onPrimaryContainer: string;
    secondary: string;
    onSecondary: string;
    secondaryContainer: string;
    onSecondaryContainer: string;
    tertiary: string;
    onTertiary: string;
    tertiaryContainer: string;
    onTertiaryContainer: string;
    error: string;
    onError: string;
    errorContainer: string;
    onErrorContainer: string;
    background: string;
    onBackground: string;
    surface: string;
    onSurface: string;
    surfaceVariant: string;
    onSurfaceVariant: string;
    outline: string;
    outlineVariant: string;
    surfaceContainerLowest: string;
    surfaceContainerLow: string;
    surfaceContainer: string;
    surfaceContainerHigh: string;
    surfaceContainerHighest: string;
  };
  typography: {
    displayLarge: ThemeTypographyToken;
    headlineMedium: ThemeTypographyToken;
    titleLarge: ThemeTypographyToken;
    titleMedium: ThemeTypographyToken;
    bodyLarge: ThemeTypographyToken;
    bodyMedium: ThemeTypographyToken;
    labelLarge: ThemeTypographyToken;
    labelSmall: ThemeTypographyToken;
  };
}

const themes: { [key: string]: Theme } = {
  dark: {
    colors: {
      primary: "#D0BCFF",
      onPrimary: "#381E72",
      primaryContainer: "#4F378B",
      onPrimaryContainer: "#EADDFF",
      secondary: "#CCC2DC",
      onSecondary: "#332D41",
      secondaryContainer: "#4A4458",
      onSecondaryContainer: "#E8DEF8",
      tertiary: "#EFB8C8",
      onTertiary: "#492532",
      tertiaryContainer: "#633B48",
      onTertiaryContainer: "#FFD8E4",
      error: "#F2B8B5",
      onError: "#601410",
      errorContainer: "#8C1D18",
      onErrorContainer: "#F9DEDC",
      background: "#141218",
      onBackground: "#E6E1E5",
      surface: "#141218",
      onSurface: "#E6E1E5",
      surfaceVariant: "#49454F",
      onSurfaceVariant: "#CAC4D0",
      outline: "#938F99",
      outlineVariant: "#444746",
      surfaceContainerLowest: "#0F0D13",
      surfaceContainerLow: "#1D1B20",
      surfaceContainer: "#211F26",
      surfaceContainerHigh: "#2B2930",
      surfaceContainerHighest: "#36343B",
    },
    typography: {
      displayLarge: {
        fontFamily: "System",
        fontSize: 57,
        lineHeight: 64,
        letterSpacing: -0.25,
        fontWeight: "400",
      },
      headlineMedium: {
        fontFamily: "System",
        fontSize: 28,
        lineHeight: 36,
        letterSpacing: 0,
        fontWeight: "400",
      },
      titleLarge: {
        fontFamily: "System",
        fontSize: 22,
        lineHeight: 28,
        letterSpacing: 0,
        fontWeight: "400",
      },
      titleMedium: {
        fontFamily: "System",
        fontSize: 16,
        lineHeight: 24,
        letterSpacing: 0.15,
        fontWeight: "500",
      },
      bodyLarge: {
        fontFamily: "System",
        fontSize: 16,
        lineHeight: 24,
        letterSpacing: 0.5,
        fontWeight: "400",
      },
      bodyMedium: {
        fontFamily: "System",
        fontSize: 14,
        lineHeight: 20,
        letterSpacing: 0.25,
        fontWeight: "400",
      },
      labelLarge: {
        fontFamily: "System",
        fontSize: 14,
        lineHeight: 20,
        letterSpacing: 0.1,
        fontWeight: "500",
      },
      labelSmall: {
        fontFamily: "System",
        fontSize: 11,
        lineHeight: 16,
        letterSpacing: 0.5,
        fontWeight: "500",
      },
    },
  },
  light: {
    colors: {
      primary: "#6750A4",
      onPrimary: "#FFFFFF",
      primaryContainer: "#EADDFF",
      onPrimaryContainer: "#21005D",
      secondary: "#625B71",
      onSecondary: "#FFFFFF",
      secondaryContainer: "#E8DEF8",
      onSecondaryContainer: "#1D192B",
      tertiary: "#7D5260",
      onTertiary: "#FFFFFF",
      tertiaryContainer: "#FFD8E4",
      onTertiaryContainer: "#31111D",
      error: "#B3261E",
      onError: "#FFFFFF",
      errorContainer: "#F9DEDC",
      onErrorContainer: "#410E0B",
      background: "#FEF7FF",
      onBackground: "#1D1B20",
      surface: "#FEF7FF",
      onSurface: "#1D1B20",
      surfaceVariant: "#E7E0EC",
      onSurfaceVariant: "#49454F",
      outline: "#79747E",
      outlineVariant: "#CAC4D0",
      surfaceContainerLowest: "#FFFFFF",
      surfaceContainerLow: "#F7F2FA",
      surfaceContainer: "#F3EDF7",
      surfaceContainerHigh: "#ECE6F0",
      surfaceContainerHighest: "#E6E0E9",
    },
    typography: {
      displayLarge: {
        fontFamily: "System",
        fontSize: 57,
        lineHeight: 64,
        letterSpacing: -0.25,
        fontWeight: "400",
      },
      headlineMedium: {
        fontFamily: "System",
        fontSize: 28,
        lineHeight: 36,
        letterSpacing: 0,
        fontWeight: "400",
      },
      titleLarge: {
        fontFamily: "System",
        fontSize: 22,
        lineHeight: 28,
        letterSpacing: 0,
        fontWeight: "400",
      },
      titleMedium: {
        fontFamily: "System",
        fontSize: 16,
        lineHeight: 24,
        letterSpacing: 0.15,
        fontWeight: "500",
      },
      bodyLarge: {
        fontFamily: "System",
        fontSize: 16,
        lineHeight: 24,
        letterSpacing: 0.5,
        fontWeight: "400",
      },
      bodyMedium: {
        fontFamily: "System",
        fontSize: 14,
        lineHeight: 20,
        letterSpacing: 0.25,
        fontWeight: "400",
      },
      labelLarge: {
        fontFamily: "System",
        fontSize: 14,
        lineHeight: 20,
        letterSpacing: 0.1,
        fontWeight: "500",
      },
      labelSmall: {
        fontFamily: "System",
        fontSize: 11,
        lineHeight: 16,
        letterSpacing: 0.5,
        fontWeight: "500",
      },
    },
  },
};

export default themes;
