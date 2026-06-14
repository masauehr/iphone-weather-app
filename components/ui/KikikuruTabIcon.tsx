import { View } from 'react-native';

/**
 * キキクル（洪水危険度マップ）のタブアイコン。
 * 水色の河川線・黄色の浸水リスク域・赤の高危険箇所をグレー地図背景上に描画。
 */
export function KikikuruTabIcon({ focused }: { focused: boolean }) {
  const opacity = focused ? 1.0 : 0.45;

  return (
    <View style={{ width: 28, height: 28, opacity }}>
      {/* グレーの地図背景 */}
      <View style={{
        width: 28,
        height: 28,
        backgroundColor: '#c8cdd2',
        borderRadius: 4,
        overflow: 'hidden',
      }}>

        {/* 黄色の浸水・洪水リスクゾーン */}
        <View style={{
          position: 'absolute',
          left: 1,
          top: 8,
          width: 16,
          height: 12,
          backgroundColor: '#f5de00',
          opacity: 0.82,
          borderRadius: 2,
        }} />

        {/* 赤の高危険区域（黄ゾーン内の一部） */}
        <View style={{
          position: 'absolute',
          left: 2,
          top: 11,
          width: 5,
          height: 4,
          backgroundColor: '#e83020',
          opacity: 0.9,
          borderRadius: 1,
        }} />

        {/* 水色の幹川（斜め横断） */}
        <View style={{
          position: 'absolute',
          left: -3,
          top: 17,
          width: 34,
          height: 3,
          backgroundColor: '#1ee8e8',
          transform: [{ rotate: '-12deg' }],
        }} />

        {/* 水色の支川（上から合流） */}
        <View style={{
          position: 'absolute',
          left: 16,
          top: 0,
          width: 3,
          height: 20,
          backgroundColor: '#1ee8e8',
          transform: [{ rotate: '6deg' }],
        }} />

        {/* 道路・境界線（薄いグレー） */}
        <View style={{
          position: 'absolute',
          left: 0,
          top: 6,
          width: 28,
          height: 1,
          backgroundColor: '#aaaaaa',
          opacity: 0.5,
        }} />
      </View>
    </View>
  );
}
