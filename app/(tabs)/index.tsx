import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useRef, useState } from 'react';
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

type Area = { name: string; code: string };

const DEFAULT_FAVORITES: Area[] = [
  { name: '東京', code: '130000' },
  { name: '大阪', code: '270000' },
  { name: '名古屋', code: '230000' },
];

const ALL_AREAS: Area[] = [
  // 北海道
  { name: '札幌', code: '016000' },
  { name: '函館', code: '017000' },
  { name: '旭川', code: '012000' },
  { name: '釧路', code: '014020' },
  { name: '帯広', code: '014010' },
  { name: '網走', code: '013000' },
  { name: '室蘭', code: '015010' },
  { name: '稚内', code: '011000' },
  // 東北
  { name: '青森', code: '020000' },
  { name: '岩手', code: '030000' },
  { name: '宮城', code: '040000' },
  { name: '秋田', code: '050000' },
  { name: '山形', code: '060000' },
  { name: '福島', code: '070000' },
  // 関東
  { name: '茨城', code: '080000' },
  { name: '栃木', code: '090000' },
  { name: '群馬', code: '100000' },
  { name: '埼玉', code: '110000' },
  { name: '千葉', code: '120000' },
  { name: '東京', code: '130000' },
  { name: '神奈川', code: '140000' },
  // 甲信越・北陸
  { name: '新潟', code: '150000' },
  { name: '富山', code: '160000' },
  { name: '石川', code: '170000' },
  { name: '福井', code: '180000' },
  { name: '山梨', code: '190000' },
  { name: '長野', code: '200000' },
  // 東海
  { name: '岐阜', code: '210000' },
  { name: '静岡', code: '220000' },
  { name: '愛知', code: '230000' },
  { name: '三重', code: '240000' },
  // 近畿
  { name: '滋賀', code: '250000' },
  { name: '京都', code: '260000' },
  { name: '大阪', code: '270000' },
  { name: '兵庫', code: '280000' },
  { name: '奈良', code: '290000' },
  { name: '和歌山', code: '300000' },
  // 中国
  { name: '鳥取', code: '310000' },
  { name: '島根', code: '320000' },
  { name: '岡山', code: '330000' },
  { name: '広島', code: '340000' },
  { name: '山口', code: '350000' },
  // 四国
  { name: '徳島', code: '360000' },
  { name: '香川', code: '370000' },
  { name: '愛媛', code: '380000' },
  { name: '高知', code: '390000' },
  // 九州
  { name: '福岡', code: '400000' },
  { name: '佐賀', code: '410000' },
  { name: '長崎', code: '420000' },
  { name: '熊本', code: '430000' },
  { name: '大分', code: '440000' },
  { name: '宮崎', code: '450000' },
  { name: '鹿児島', code: '460100' },
  { name: '奄美', code: '460040' },
  // 沖縄
  { name: '沖縄本島', code: '471000' },
  { name: '久米島', code: '472000' },
  { name: '南大東島', code: '473000' },
  { name: '宮古島', code: '474000' },
  { name: '八重山', code: '475000' },
  { name: '与那国島', code: '476000' },
];

function weatherEmoji(code: string): string {
  const n = parseInt(code, 10);
  const map: Record<number, string> = {
    100:'☀️',
    101:'☀️//⛅',   102:'☀️/☂️',   103:'☀️//☂️',
    104:'☀️/❄️',   105:'☀️//❄️',  106:'☀️/☂️❄️',
    107:'☀️//☂️❄️',108:'☀️/⛈️',
    110:'☀️→//⛅',  111:'☀️→⛅',   112:'☀️→/☂️',
    113:'☀️→//☂️', 114:'☀️→☂️',   115:'☀️→/❄️',
    116:'☀️→//❄️', 117:'☀️→❄️',   118:'☀️→☂️❄️',
    119:'☀️→⛈️',
    120:'☀️/☂️',   121:'☀️/☂️',   122:'☀️/☂️',
    123:'☀️/⛈️',   124:'☀️/❄️',   125:'☀️/⛈️',
    126:'☀️→☂️',   127:'☀️→☂️',   128:'☀️→☂️',
    130:'🌫️☀️',   131:'☀️🌫️',   132:'☀️//⛅',
    140:'☀️//⛈️',
    160:'☀️/☂️❄️', 170:'☀️//☂️❄️', 181:'☀️→☂️❄️',
    200:'☁️',
    201:'☁️//☀️',   202:'☁️/☂️',   203:'☁️//☂️',
    204:'☁️/❄️',   205:'☁️//❄️',  206:'☁️/☂️❄️',
    207:'☁️//☂️❄️',208:'☁️/⛈️',   209:'🌫️',
    210:'☁️→//☀️',  211:'☁️→☀️',   212:'☁️→/☂️',
    213:'☁️→//☂️', 214:'☁️→☂️',   215:'☁️→/❄️',
    216:'☁️→//❄️', 217:'☁️→❄️',   218:'☁️→☂️❄️',
    219:'☁️→⛈️',
    220:'☁️/☂️',   221:'☁️/☂️',   222:'☁️/☂️',
    223:'☁️//☀️',
    224:'☁️→☂️',   225:'☁️→☂️',   226:'☁️→☂️',
    228:'☁️→❄️',   229:'☁️→❄️',   230:'☁️→❄️',
    231:'☁️🌫️',   240:'☁️//⛈️',
    250:'☁️//⛈️❄️', 260:'☁️/☂️❄️', 270:'☁️//☂️❄️',
    281:'☁️→☂️❄️',
    300:'☂️',
    301:'☂️//☀️',   302:'☂️',      303:'☂️//❄️',
    304:'☂️❄️',    306:'☂️',      308:'☂️💨',
    309:'☂️/❄️',
    311:'☂️→☀️',   313:'☂️→☁️',
    314:'☂️→//❄️', 315:'☂️→❄️',
    316:'☂️❄️→☀️', 317:'☂️❄️→☁️',
    320:'☂️→☀️',   321:'☂️→☁️',   322:'☂️/❄️',
    323:'☂️→☀️',   324:'☂️→☀️',   325:'☂️→☀️',
    326:'☂️→❄️',   327:'☂️→❄️',   328:'☂️',
    329:'☂️/❄️',   340:'❄️☂️',    350:'☂️⛈️',
    361:'❄️☂️→☀️', 371:'❄️☂️→☁️',
    400:'❄️',
    401:'❄️//☀️',   402:'❄️',      403:'❄️//☂️',
    405:'❄️',      406:'❄️💨',    407:'❄️🌀',
    409:'❄️/☂️',
    411:'❄️→☀️',   413:'❄️→☁️',   414:'❄️→☂️',
    420:'❄️→☀️',   421:'❄️→☁️',   422:'❄️→☂️',
    423:'❄️→☂️',   425:'❄️',
    426:'❄️→/☂️',  427:'❄️/☂️',   450:'❄️⛈️',
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
  const [favorites, setFavorites] = useState<Area[]>(DEFAULT_FAVORITES);
  const [editMode, setEditMode] = useState(false);
  const [editingFavIdx, setEditingFavIdx] = useState<number | null>(null);

  const [selectedArea, setSelectedArea] = useState<Area>(DEFAULT_FAVORITES[0]);
  const [shortForecasts, setShortForecasts] = useState<DayForecast[]>([]);
  const [weekForecasts, setWeekForecasts] = useState<DayForecast[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [viewMode, setViewMode] = useState<'short' | 'week'>('short');
  const [modalVisible, setModalVisible] = useState(false);

  const initializedRef = useRef(false);

  useEffect(() => {
    (async () => {
      try {
        const [favStr, lastCode] = await Promise.all([
          AsyncStorage.getItem('favorites'),
          AsyncStorage.getItem('lastArea'),
        ]);
        let loaded: Area[] = DEFAULT_FAVORITES;
        if (favStr) {
          const parsed = JSON.parse(favStr);
          if (Array.isArray(parsed) && parsed.length === 3) loaded = parsed;
        }
        setFavorites(loaded);

        let area: Area = loaded[0];
        if (lastCode) {
          const found = ALL_AREAS.find((a) => a.code === lastCode);
          if (found) area = found;
        }
        setSelectedArea(area);
        fetchWeather(area.code);
      } catch {
        fetchWeather(DEFAULT_FAVORITES[0].code);
      }
      initializedRef.current = true;
    })();
  }, []);

  async function saveFavorites(favs: Area[]) {
    setFavorites(favs);
    try { await AsyncStorage.setItem('favorites', JSON.stringify(favs)); } catch {}
  }

  async function selectArea(area: Area) {
    setSelectedArea(area);
    try { await AsyncStorage.setItem('lastArea', area.code); } catch {}
    fetchWeather(area.code);
  }

  async function fetchWeather(code: string) {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(
        `https://www.jma.go.jp/bosai/forecast/data/forecast/${code}.json`
      );
      const json = await res.json();

      const ts0 = json[0].timeSeries;
      const weatherSeries = ts0[0];
      const dates = weatherSeries.timeDefines.slice(0, 3);
      const weathers: string[] = weatherSeries.areas[0].weathers.slice(0, 3);
      const weatherCodes: string[] = weatherSeries.areas[0].weatherCodes.slice(0, 3);

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

    } catch {
      setError('天気情報の取得に失敗しました');
    } finally {
      setLoading(false);
    }
  }

  function handleFavPress(fav: Area, idx: number) {
    if (editMode) {
      setEditingFavIdx(idx);
      setModalVisible(true);
    } else {
      selectArea(fav);
    }
  }

  function handleModalSelect(area: Area) {
    if (editingFavIdx !== null) {
      const next = [...favorites];
      next[editingFavIdx] = area;
      saveFavorites(next);
      setEditingFavIdx(null);
      setModalVisible(false);
    } else {
      selectArea(area);
      setModalVisible(false);
    }
  }

  function openOtherModal() {
    setEditingFavIdx(null);
    setModalVisible(true);
  }

  const forecasts = viewMode === 'short' ? shortForecasts : weekForecasts;
  const isFavArea = favorites.some((f) => f.code === selectedArea.code);

  return (
    <View style={styles.container}>
      {/* タイトル + 更新ボタン */}
      <View style={styles.titleRow}>
        <Text style={styles.title}>🌤️ 天気予報</Text>
        <TouchableOpacity
          style={styles.refreshButton}
          onPress={() => fetchWeather(selectedArea.code)}
          disabled={loading}
        >
          <Text style={styles.refreshText}>{loading ? '…' : '↻'}</Text>
        </TouchableOpacity>
      </View>

      {/* お気に入り + 編集 + その他 */}
      <View style={styles.areaRow}>
        {favorites.map((fav, idx) => {
          const isActive = !editMode && fav.code === selectedArea.code;
          const isEditSlot = editMode;
          return (
            <TouchableOpacity
              key={idx}
              style={[
                styles.areaButton,
                isActive && styles.areaButtonActive,
                isEditSlot && styles.areaButtonEdit,
              ]}
              onPress={() => handleFavPress(fav, idx)}
            >
              <Text style={isActive ? styles.areaTextActive : styles.areaText}>
                {fav.name}
                {isEditSlot && <Text style={styles.editPin}> ✎</Text>}
              </Text>
            </TouchableOpacity>
          );
        })}

        <TouchableOpacity
          style={[styles.areaButton, editMode && styles.areaButtonDone]}
          onPress={() => setEditMode(!editMode)}
        >
          <Text style={[styles.areaText, editMode && { color: '#fff' }]}>
            {editMode ? '完了' : '✎'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.areaButton,
            !isFavArea && !editMode && styles.areaButtonActive,
          ]}
          onPress={openOtherModal}
        >
          <Text style={
            !isFavArea && !editMode ? styles.areaTextActive : styles.areaText
          }>
            {!isFavArea ? selectedArea.name + ' ▼' : 'その他▼'}
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

      {/* 地点選択モーダル */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>
              {editingFavIdx !== null
                ? `お気に入り${editingFavIdx + 1}を変更`
                : '地点を選択'}
            </Text>
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
                  onPress={() => handleModalSelect(item)}
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
            <TouchableOpacity style={styles.closeButton} onPress={() => {
              setModalVisible(false);
              setEditingFavIdx(null);
            }}>
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
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    textAlign: 'center',
    color: '#1a3a5c',
    flex: 1,
  },
  refreshButton: {
    position: 'absolute',
    right: 0,
    paddingHorizontal: 10,
    paddingVertical: 4,
    backgroundColor: '#4a90e2',
    borderRadius: 16,
  },
  refreshText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
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
  areaButtonEdit: {
    borderColor: '#e67e22',
    borderWidth: 1.5,
  },
  areaButtonDone: {
    backgroundColor: '#e67e22',
    borderColor: '#e67e22',
  },
  areaText: { color: '#000', fontWeight: '600', fontSize: 12 },
  areaTextActive: { color: '#fff', fontWeight: '600', fontSize: 12 },
  editPin: { fontSize: 10, color: '#e67e22' },
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
