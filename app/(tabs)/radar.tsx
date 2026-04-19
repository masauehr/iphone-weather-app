import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useNavigation } from 'expo-router';
import { radarHtml } from '@/assets/html/radarHtml';

export default function RadarScreen() {
  const navigation = useNavigation();
  const [iframeKey, setIframeKey] = useState(0);

  useEffect(() => {
    const parent = navigation.getParent();
    if (!parent) return;
    /* 同じタブを再タップしたときにiframeを強制リロード（黒画面リセット） */
    const unsubscribe = (parent as any).addListener('tabPress', () => {
      if (navigation.isFocused()) {
        setIframeKey(k => k + 1);
      }
    });
    return unsubscribe;
  }, [navigation]);

  return (
    <View style={styles.container}>
      <iframe
        key={iframeKey}
        srcDoc={radarHtml}
        style={styles.iframe as any}
        title="レーダー+衛星"
        sandbox="allow-scripts allow-same-origin"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a2e',
  },
  iframe: {
    flex: 1,
    border: 'none',
    width: '100%',
    height: '100%',
  },
});
