import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useNavigation } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import WebView from 'react-native-webview';
import { radarHtml } from '@/assets/html/radarHtml';

export default function RadarScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const [webViewKey, setWebViewKey] = useState(0);

  useEffect(() => {
    const parent = navigation.getParent();
    if (!parent) return;
    /* 同じタブを再タップしたときにWebViewを強制リロード（黒画面リセット） */
    const unsubscribe = (parent as any).addListener('tabPress', () => {
      if (navigation.isFocused()) {
        setWebViewKey(k => k + 1);
      }
    });
    return unsubscribe;
  }, [navigation]);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <WebView
        key={webViewKey}
        source={{ html: radarHtml }}
        style={styles.webview}
        originWhitelist={['*']}
        javaScriptEnabled
        domStorageEnabled
        allowsInlineMediaPlayback
        scrollEnabled={false}
        bounces={false}
        overScrollMode="never"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a2e',
  },
  webview: {
    flex: 1,
    backgroundColor: '#1a1a2e',
  },
});
