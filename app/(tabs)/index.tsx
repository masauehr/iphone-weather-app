import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

const MAIN_AREAS = [
  { name: '東京', code: '130000' },
  { name: '大阪', code: '270000' },
  { name: '名古屋', code: '230000' },
  { name: '札幌', code: '016000' },
  { name: '福岡', code: '400000' },
  { name: '那覇', code: '471000' },
];

const ALL_AREAS = [
  { name: '北海道', code: '016000' },
  { name: '青森', code: '020000' },
  { name: '岩手', code: '030000' },
  { name: '宮城', code: '040000' },
  { name: '秋田', code: '050000' },
  { name: '山形', code: '060000' },
  { name: '福島', code: '070000' },
  { name: '茨城', code: '080000' },
  { name: '栃木', code: '090000' },
  { name: '群馬', code: '100000' },
  { name: '埼玉', code: '110000' },
  { name: '千葉', code: '120000' },
  { name: '東京', code: '130000' },
  { name: '神奈川', code: '140000' },
  { name: '新潟', code: '150000' },
  { name: '富山', code: '160000' },
  { name: '石川', code: '170000' },
  { name: '福井', code: '180000' },
  { name: '山梨', code: '190000' },
  { name: '長野', code: '200000' },
  { name: '岐阜', code: '210000' },
  { name: '静岡', code: '220000' },
  { name: '愛知', code: '230000' },
  { name: '三重', code: '240000' },
  { name: '滋賀', code: '250000' },
  { name: '京都', code: '260000' },
  { name: '大阪', code: '270000' },
  { name: '兵庫', code: '280000' },
  { name: '奈良', code: '290000' },
  { name: '和歌山', code: '300000' },
  { name: '鳥取', code: '310000' },
  { name: '島根', code: '320000' },
  { name: '岡山', code: '330000' },
  { name: '広島', code: '340000' },
  { name: '山口', code: '350000' },
  { name: '徳島', code: '360000' },
  { name: '香川', code: '370000' },
  { name: '愛媛', code: '380000' },
  { name: '高知', code: '390000' },
  { name: '福岡', code: '400000' },
  { name: '佐賀', code: '410000' },
  { name: '長崎', code: '420000' },
  { name: '熊本', code: '430000' },
  { name: '大分', code: '440000' },
  { name: '宮崎', code: '450000' },
  { name: '鹿児島', code: '460100' },
  { name: '沖縄', code: '471000' },
];

// ☂️→☂️ に統一
function weatherEmoji(code: string): string {
  const n = parseInt(code, 10);
  const map: Record<number, string> = {
    // 晴れ系
    100:'☀️',
    101:'☀️//⛅',   // 時々くもり
    102:'☀️/☂️',   // 一時雨
    103:'☀️//☂️',  // 時々雨
    104:'☀️/❄️',   // 一時雪
    105:'☀️//❄️',  // 時々雪
    106:'☀️/☂️❄️', // 一時雨か雪
    107:'☀️//☂️❄️',// 時々雨か雪
    108:'☀️/⛈️',   // 一時雷雨
    110:'☀️→//⛅',  // のち時々くもり
    111:'☀️→⛅',   // のちくもり
    112:'☀️→/☂️',  // のち一時雨
    113:'☀️→//☂️', // のち時々雨
    114:'☀️→☂️',   // のち雨
    115:'☀️→/❄️',  // のち一時雪
    116:'☀️→//❄️', // のち時々雪
    117:'☀️→❄️',   // のち雪
    118:'☀️→☂️❄️', // のち雨か雪
    119:'☀️→⛈️',   // のち雷雨
    120:'☀️/☂️',   // 一時雨（朝夕）
    121:'☀️/☂️',   // 一時雨（朝）
    122:'☀️/☂️',   // 一時雨（夕）
    123:'☀️/⛈️',   // 一時雷雨
    124:'☀️/❄️',   // 一時雪
    125:'☀️/⛈️',   // 一時雷雨（午後）
    126:'☀️→☂️',   127:'☀️→☂️', 128:'☀️→☂️',  // 昼/夕/夜から雨
    130:'🌫️☀️',   131:'☀️🌫️', 132:'☀️//⛅',
    140:'☀️//⛈️',  // 時々雷雨
    160:'☀️/☂️❄️', 170:'☀️//☂️❄️', 181:'☀️→☂️❄️', // のち雨か雪
    // くもり系
    200:'☁️',
    201:'☁️//☀️',   // 時々晴れ
    202:'☁️/☂️',   // 一時雨
    203:'☁️//☂️',  // 時々雨
    204:'☁️/❄️',   // 一時雪
    205:'☁️//❄️',  // 時々雪
    206:'☁️/☂️❄️', // 一時雨か雪
    207:'☁️//☂️❄️',// 時々雨か雪
    208:'☁️/⛈️',   // 一時雷雨
    209:'🌫️',
    210:'☁️→//☀️',  // のち時々晴れ
    211:'☁️→☀️',   // のち晴れ
    212:'☁️→/☂️',  // のち一時雨
    213:'☁️→//☂️', // のち時々雨
    214:'☁️→☂️',  215:'☁️→/❄️', 216:'☁️→//❄️', // のち雨/一時雪/時々雪
    217:'☁️→❄️',  218:'☁️→☂️❄️', 219:'☁️→⛈️',  // のち雪/雨か雪/雷雨
    220:'☁️/☂️',   221:'☁️/☂️',  222:'☁️/☂️',
    223:'☁️//☀️',   // 時々晴れ
    224:'☁️→☂️',  225:'☁️→☂️',  226:'☁️→☂️',   // 昼/夕/夜から雨
    228:'☁️→❄️',  229:'☁️→❄️',  230:'☁️→❄️',  231:'☁️🌫️', // のち雪
    240:'☁️//⛈️',  // 時々雷雨
    250:'☁️//⛈️❄️', 260:'☁️/☂️❄️', 270:'☁️//☂️❄️', 281:'☁️→☂️❄️', // のち雨か雪
    // 雨系
    300:'☂️',
    301:'☂️//☀️',  // 時々晴れ
    302:'☂️',      // 時々止む
    303:'☂️//❄️',  // 時々雪
    304:'☂️❄️',   306:'☂️',    308:'☂️💨',
    309:'☂️/❄️',   // 一時雪
    311:'☂️→☀️',  313:'☂️→☁️',  // のち晴れ/くもり
    314:'☂️→//❄️', // のち時々雪
    315:'☂️→❄️',  316:'☂️❄️→☀️', 317:'☂️❄️→☁️', // のち雪/雨か雪のち晴れ/くもり
    320:'☂️→☀️',  321:'☂️→☁️',  // のち晴れ/くもり（夕/夜）
    322:'☂️/❄️',   // 一時雪（朝晩）
    323:'☂️→☀️',  324:'☂️→☀️',  325:'☂️→☀️',  // 昼/夕/夜晴れ
    326:'☂️→❄️',  327:'☂️→❄️',  328:'☂️',
    329:'☂️/❄️',   // 一時みぞれ
    340:'❄️☂️',   350:'☂️⛈️',
    361:'❄️☂️→☀️', 371:'❄️☂️→☁️', // 雪か雨のち晴れ/くもり
    // 雪系
    400:'❄️',
    401:'❄️//☀️',  // 時々晴れ
    402:'❄️',      // 時々止む
    403:'❄️//☂️',  // 時々雨
    405:'❄️',      406:'❄️💨',  407:'❄️🌀',
    409:'❄️/☂️',   // 一時雨
    411:'❄️→☀️',  413:'❄️→☁️',  414:'❄️→☂️',  // のち晴れ/くもり/雨
    420:'❄️→☀️',  421:'❄️→☁️',  422:'❄️→☂️',  423:'❄️→☂️', // のち系（夕/夜）
    425:'❄️',
    426:'❄️→/☂️',  // のちみぞれ
    427:'❄️/☂️',   // 一時みぞれ
    450:'❄️⛈️',
  };
  return map[n] ?? '🌈';
}

type DayForecast = {
  date: string;
  label: string;
  weather: string;
  weatherCode: string;
  tempMax: string;
  tempMin: string;
  pop: string;
};

const toDay = (iso: string) => iso.slice(0, 10);

function formatDate(iso: string): string {
  const d = new Date(iso);
  const w = ['日', '月', '火', '水', '木', '金', '土'];
  return `${d.getMonth() + 1}/${d.getDate()}(${w[d.getDay()]})`;
}

export default function WeatherScreen() {
  const [selectedArea, setSelectedArea] = useState(MAIN_AREAS[0]);
  const [shortForecasts, setShortForecasts] = useState<DayForecast[]>([]);
  const [weekForecasts, setWeekForecasts] = useState<DayForecast[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [viewMode, setViewMode] = useState<'short' | 'week'>('short');
  const [modalVisible, setModalVisible] = useState(false);

  useEffect(() => {
    fetchWeather(selectedArea.code);
  }, [selectedArea]);

  async function fetchWeather(code: string) {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(
        `https://www.jma.go.jp/bosai/forecast/data/forecast/${code}.json`
      );
      const json = await res.json();

      // ── 短期予報 ──
      const ts0 = json[0].timeSeries;
      const weatherSeries = ts0[0];
      const dates = weatherSeries.timeDefines.slice(0, 3);
      const weathers: string[] = weatherSeries.areas[0].weathers.slice(0, 3);
      const weatherCodes: string[] = weatherSeries.areas[0].weatherCodes.slice(0, 3);

      // 短期降水確率: 時間帯ごとの最大値を日別に集計
      const popSeries = ts0[1];
      const popDates: string[] = popSeries?.timeDefines ?? [];
      const rawPops: string[] = popSeries?.areas[0]?.pops ?? [];
      const getDayPop = (dateStr: string) => {
        const vals = popDates
          .map((td, i) => ({ d: toDay(td), v: rawPops[i] }))
          .filter((x) => x.d === dateStr && x.v !== '')
          .map((x) => parseInt(x.v));
        return vals.length > 0 ? String(Math.max(...vals)) : '--';
      };

      // 短期予報の気温系列（今日・明日分）から日付照合で最高・最低を取得
      const shortTempDates: string[] = ts0[2]?.timeDefines ?? [];
      const shortTempValues: string[] = ts0[2]?.areas[0]?.temps ?? [];
      const getShortTemp = (dateStr: string) => {
        const vals = shortTempDates
          .map((td, i) => ({ d: toDay(td), v: shortTempValues[i] }))
          .filter((x) => x.d === dateStr && x.v !== '')
          .map((x) => parseInt(x.v))
          .filter((v) => !isNaN(v));
        if (vals.length === 0) return { min: null, max: null };
        return { min: String(Math.min(...vals)), max: String(Math.max(...vals)) };
      };

      // ── 週間予報データ（短期の補完にも使用）──
      const wts = json[1]?.timeSeries ?? [];
      const wWeatherSeries = wts[0];
      const wDates: string[] = wWeatherSeries?.timeDefines ?? [];
      const wCodes: string[] = wWeatherSeries?.areas[0]?.weatherCodes ?? [];
      const wPops: string[] = wWeatherSeries?.areas[0]?.pops ?? [];
      const weekTempSeries = (json[1]?.timeSeries ?? []).find(
        (t: any) => t.areas?.[0]?.tempsMax !== undefined
      ) ?? null;
      const wMax: string[] = weekTempSeries?.areas[0]?.tempsMax ?? [];
      const wMin: string[] = weekTempSeries?.areas[0]?.tempsMin ?? [];
      const wTempDates: string[] = weekTempSeries?.timeDefines ?? [];

      const getWeekPop = (dateStr: string) => {
        const ti = wDates.findIndex((d) => toDay(d) === dateStr);
        return ti >= 0 && wPops[ti] !== '' ? wPops[ti] : '--';
      };
      const getWeekTemp = (dateStr: string) => {
        const ti = wTempDates.findIndex((d) => toDay(d) === dateStr);
        if (ti < 0) return { min: null, max: null };
        return {
          min: wMin[ti] !== '' ? wMin[ti] : null,
          max: wMax[ti] !== '' ? wMax[ti] : null,
        };
      };

      const dayLabels = ['今日', '明日', '明後日'];
      const short: DayForecast[] = dates.map((d: string, i: number) => {
        const dateStr = toDay(d);
        const shortTemp = getShortTemp(dateStr);
        const weekTemp = getWeekTemp(dateStr);
        const pop = getDayPop(dateStr) !== '--' ? getDayPop(dateStr) : getWeekPop(dateStr);
        return {
          date: d,
          label: dayLabels[i],
          weather: weathers[i] ?? '',
          weatherCode: weatherCodes[i] ?? '100',
          tempMax: shortTemp.max ?? weekTemp.max ?? '--',
          tempMin: shortTemp.min ?? weekTemp.min ?? '--',
          pop,
        };
      });
      setShortForecasts(short);

      const week: DayForecast[] = wDates.map((d: string, i: number) => ({
        date: d,
        label: formatDate(d),
        weather: '',
        weatherCode: wCodes[i] ?? '100',
        tempMax: wMax[i] && wMax[i] !== '' ? wMax[i] : '--',
        tempMin: wMin[i] && wMin[i] !== '' ? wMin[i] : '--',
        pop: wPops[i] && wPops[i] !== '' ? wPops[i] : '--',
      }));
      setWeekForecasts(week);

    } catch (e) {
      setError('天気情報の取得に失敗しました');
    } finally {
      setLoading(false);
    }
  }

  const forecasts = viewMode === 'short' ? shortForecasts : weekForecasts;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>🌤️ 天気予報</Text>

      {/* エリア選択 */}
      <View style={styles.areaRow}>
        {MAIN_AREAS.map((item) => (
          <TouchableOpacity
            key={item.code}
            style={[
              styles.areaButton,
              item.code === selectedArea.code && styles.areaButtonActive,
            ]}
            onPress={() => setSelectedArea(item)}
          >
            <Text style={item.code === selectedArea.code ? styles.areaTextActive : styles.areaText}>
              {item.name}
            </Text>
          </TouchableOpacity>
        ))}
        <TouchableOpacity
          style={[
            styles.areaButton,
            !MAIN_AREAS.find((a) => a.code === selectedArea.code) && styles.areaButtonActive,
          ]}
          onPress={() => setModalVisible(true)}
        >
          <Text style={
            !MAIN_AREAS.find((a) => a.code === selectedArea.code)
              ? styles.areaTextActive
              : styles.areaText
          }>
            {MAIN_AREAS.find((a) => a.code === selectedArea.code) ? 'その他▼' : selectedArea.name + ' ▼'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* 短期/週間 切替 */}
      <View style={styles.toggleRow}>
        <TouchableOpacity
          style={[styles.toggleButton, viewMode === 'short' && styles.toggleButtonActive]}
          onPress={() => setViewMode('short')}
        >
          <Text style={viewMode === 'short' ? styles.toggleTextActive : styles.toggleText}>短期予報（3日）</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.toggleButton, viewMode === 'week' && styles.toggleButtonActive]}
          onPress={() => setViewMode('week')}
        >
          <Text style={viewMode === 'week' ? styles.toggleTextActive : styles.toggleText}>週間予報（7日）</Text>
        </TouchableOpacity>
      </View>

      {/* 天気カード */}
      {loading && <ActivityIndicator size="large" color="#4a90e2" style={{ marginTop: 30 }} />}
      {error !== '' && <Text style={styles.error}>{error}</Text>}

      <ScrollView showsVerticalScrollIndicator={false}>
        {!loading && forecasts.map((f, i) => {
          const isToday = i === 0 && viewMode === 'short';
          return (
            <View key={i} style={[styles.card, isToday && styles.cardToday]}>
              <View style={styles.cardLeft}>
                <Text style={[styles.cardLabel, isToday && styles.cardLabelToday]}>{f.label}</Text>
                <Text style={[styles.cardDate, isToday && styles.cardDateToday]}>{formatDate(f.date)}</Text>
                {viewMode === 'short' && f.weather !== '' && (
                  <Text style={[styles.cardWeather, isToday && styles.cardWeatherToday]} numberOfLines={2}>
                    {f.weather}
                  </Text>
                )}
              </View>
              <Text style={styles.cardEmoji} numberOfLines={1} adjustsFontSizeToFit>{weatherEmoji(f.weatherCode)}</Text>
              <View style={styles.cardRight}>
                <Text style={styles.popText}>☂ {f.pop !== '--' ? f.pop + '%' : '--'}</Text>
                <Text style={styles.tempMax}>▲{f.tempMax}°</Text>
                <Text style={styles.tempMin}>▼{f.tempMin}°</Text>
              </View>
            </View>
          );
        })}
        <Text style={styles.source}>出典: 気象庁</Text>
      </ScrollView>

      {/* 都道府県選択モーダル */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>都道府県を選択</Text>
            <FlatList
              data={ALL_AREAS}
              keyExtractor={(item) => item.code}
              numColumns={4}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.prefButton,
                    item.code === selectedArea.code && styles.prefButtonActive,
                  ]}
                  onPress={() => {
                    setSelectedArea(item);
                    setModalVisible(false);
                  }}
                >
                  <Text style={[
                    styles.prefText,
                    item.code === selectedArea.code && styles.prefTextActive,
                  ]}>
                    {item.name}
                  </Text>
                </TouchableOpacity>
              )}
            />
            <TouchableOpacity style={styles.closeButton} onPress={() => setModalVisible(false)}>
              <Text style={styles.closeText}>閉じる</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#e8f4fd',
    paddingTop: 60,
    paddingHorizontal: 12,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 12,
    color: '#1a3a5c',
  },
  areaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 12,
  },
  areaButton: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#b0cde8',
  },
  areaButtonActive: {
    backgroundColor: '#4a90e2',
    borderColor: '#4a90e2',
  },
  areaText: { color: '#000', fontWeight: '600', fontSize: 12 },
  areaTextActive: { color: '#fff', fontWeight: '600', fontSize: 12 },
  toggleRow: {
    flexDirection: 'row',
    marginBottom: 12,
    borderRadius: 10,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#4a90e2',
  },
  toggleButton: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  toggleButtonActive: { backgroundColor: '#4a90e2' },
  toggleText: { color: '#4a90e2', fontWeight: '600', fontSize: 13 },
  toggleTextActive: { color: '#fff', fontWeight: '600', fontSize: 13 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 14,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  cardToday: { backgroundColor: '#4a90e2' },
  cardLeft: { flex: 2 },
  cardLabel: { fontSize: 15, fontWeight: 'bold', color: '#222' },
  cardLabelToday: { color: '#fff' },
  cardDate: { fontSize: 11, color: '#888', marginTop: 2 },
  cardDateToday: { color: '#cde' },
  cardWeather: { fontSize: 11, color: '#555', marginTop: 4, flexShrink: 1 },
  cardWeatherToday: { color: '#def' },
  cardEmoji: { fontSize: 22, flex: 1.5, textAlign: 'center', minWidth: 0 },
  cardRight: { flex: 2, alignItems: 'flex-end' },
  popText: { fontSize: 12, color: '#3498db', marginBottom: 2 },
  tempMax: { fontSize: 14, fontWeight: 'bold', color: '#e74c3c' },
  tempMin: { fontSize: 14, fontWeight: 'bold', color: '#3498db' },
  error: { color: 'red', textAlign: 'center', marginTop: 20 },
  source: { textAlign: 'center', fontSize: 11, color: '#aaa', marginVertical: 12 },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalBox: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '75%',
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 14,
    color: '#1a3a5c',
  },
  prefButton: {
    flex: 1,
    margin: 3,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#f0f4f8',
    alignItems: 'center',
  },
  prefButtonActive: { backgroundColor: '#4a90e2' },
  prefText: { fontSize: 12, color: '#333' },
  prefTextActive: { fontSize: 12, color: '#fff', fontWeight: 'bold' },
  closeButton: {
    marginTop: 14,
    backgroundColor: '#4a90e2',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
  },
  closeText: { color: '#fff', fontWeight: 'bold', fontSize: 15 },
});
