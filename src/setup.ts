/**
 * Global React Native defaults applied once at app startup.
 *
 * allowFontScaling = false: Prevents Android's "Display > Font Size"
 * accessibility setting from enlarging/shrinking text. This makes font
 * sizes on Android match exactly what iOS renders, since iOS does not
 * honour system font scale in the same way.
 *
 * This must be imported before any component tree renders.
 */
import { Text, TextInput } from 'react-native';

// @ts-expect-error — defaultProps exists on the class component at runtime
Text.defaultProps = { ...(Text.defaultProps ?? {}), allowFontScaling: false };

(TextInput as unknown as { defaultProps: Record<string, unknown> }).defaultProps = {
  allowFontScaling: false,
};
