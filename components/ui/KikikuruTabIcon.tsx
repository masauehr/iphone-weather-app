import { Image, View } from 'react-native';

const icon = require('@/assets/images/kikikuru-icon.png');

/**
 * キキクルタブ用アイコン。
 * 地図風PNG（水色河川・黄色リスクゾーン・赤危険区域）を表示。
 */
export function KikikuruTabIcon({ focused, size = 28 }: { focused: boolean; size?: number }) {
  return (
    <View style={{ opacity: focused ? 1.0 : 0.45 }}>
      <Image
        source={icon}
        style={{ width: size, height: size }}
        resizeMode="contain"
      />
    </View>
  );
}
