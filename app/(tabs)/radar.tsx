import { StyleSheet, View } from 'react-native';
import { radarHtml } from '@/assets/html/radarHtml';

export default function RadarScreen() {
  return (
    <View style={styles.container}>
      <iframe
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
