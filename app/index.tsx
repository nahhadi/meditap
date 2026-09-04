import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';
import { Feather } from '@expo/vector-icons';
import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';
import theme from '@/constants/colors';

type Dose = {
  id: string;
  date: string;
  time: string;
  label: string;
  source: 'NFC' | 'Manual';
};

type NDEFReadingEvent = { serialNumber?: string };
type NDEFReaderLike = {
  scan: () => Promise<void>;
  onreading: ((event: NDEFReadingEvent) => void) | null;
};
type NDEFReaderConstructor = new () => NDEFReaderLike;

declare global {
  interface Window {
    NDEFReader?: NDEFReaderConstructor;
  }
}

const STORAGE_KEY = 'dosekey-dose-log-v1';
const REMINDER_KEY = 'dosekey-reminder-v1';
const medication = { name: 'Vitamin D3', dose: '1000 IU', next: '8:00 PM', schedule: 'Once daily' };
const sansSerifFont = Platform.select({
  ios: 'System',
  android: 'sans-serif',
  web: 'system-ui',
  default: 'sans-serif',
}) ?? 'sans-serif';

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

function makeSeedDoses(): Dose[] {
  const date = todayKey();
  return [
    { id: date + '-0800', date, time: '8:02 AM', label: 'Morning dose', source: 'NFC' },
    { id: date + '-1320', date, time: '1:20 PM', label: 'Afternoon dose', source: 'Manual' },
  ];
}

function formatNow() {
  return new Intl.DateTimeFormat(undefined, { hour: 'numeric', minute: '2-digit' }).format(new Date());
}

export default function HomeScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [doses, setDoses] = useState<Dose[]>([]);
  const [remindersOn, setRemindersOn] = useState(true);
  const [isReady, setIsReady] = useState(false);
  const [scanVisible, setScanVisible] = useState(false);
  const [settingsVisible, setSettingsVisible] = useState(false);
  const [scanState, setScanState] = useState<'ready' | 'scanning' | 'success'>('ready');
  const [showHistory, setShowHistory] = useState(false);

  useEffect(() => {
    Promise.all([AsyncStorage.getItem(STORAGE_KEY), AsyncStorage.getItem(REMINDER_KEY)]).then(([savedDoses, savedReminder]) => {
      setDoses(savedDoses ? JSON.parse(savedDoses) as Dose[] : makeSeedDoses());
      if (savedReminder !== null) setRemindersOn(savedReminder === 'true');
      setIsReady(true);
    }).catch(() => {
      setDoses(makeSeedDoses());
      setIsReady(true);
    });
  }, []);

  useEffect(() => {
    if (!isReady) return;
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(doses)).catch(() => undefined);
  }, [doses, isReady]);

  useEffect(() => {
    if (!isReady) return;
    AsyncStorage.setItem(REMINDER_KEY, String(remindersOn)).catch(() => undefined);
  }, [remindersOn, isReady]);

  const todaysDoses = useMemo(() => doses.filter((dose) => dose.date === todayKey()), [doses]);
  const adherence = Math.min(100, Math.round((todaysDoses.length / 2) * 100));
  const sortedDoses = [...doses].sort((a, b) => b.id.localeCompare(a.id));

  const giveFeedback = async () => {
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const confirmDose = async (source: Dose['source'] = 'Manual') => {
    const newDose: Dose = {
      id: String(Date.now()) + Math.random().toString(36).slice(2, 7),
      date: todayKey(),
      time: formatNow(),
      label: 'Dose logged',
      source,
    };
    setDoses((current) => [newDose, ...current]);
    setScanState('success');
    await giveFeedback();
  };

  const openScan = async () => {
    setScanState('scanning');
    setScanVisible(true);
    if (Platform.OS === 'web' && typeof window !== 'undefined' && window.NDEFReader) {
      try {
        const reader = new window.NDEFReader();
        reader.onreading = () => { confirmDose('NFC').catch(() => undefined); };
        await reader.scan();
      } catch {
        setScanState('ready');
      }
    }
  };

  const closeScan = () => {
    setScanVisible(false);
    setScanState('ready');
  };

  const handlePreviewScan = () => {
    confirmDose('NFC').catch(() => undefined);
  };

  const topInset = Platform.OS === 'web' ? Math.max(insets.top, 67) + 14 : insets.top + 14;
  const bottomInset = insets.bottom + (Platform.OS === 'web' ? 34 : 18);

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <StatusBar barStyle="light-content" />
      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingTop: topInset, paddingBottom: bottomInset }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.headerRow}>
          <View>
            <Text style={[styles.eyebrow, { color: colors.heroSoft }]}>FRIDAY, SEPTEMBER 4</Text>
            <Text style={[styles.greeting, { color: colors.foreground }]}>Good morning</Text>
          </View>
          <Pressable
            accessibilityLabel="Open settings"
            testID="settings-button"
            onPress={() => setSettingsVisible(true)}
            style={({ pressed }) => [styles.iconButton, { backgroundColor: colors.card, opacity: pressed ? 0.7 : 1 }]}
          >
            <Feather name="sliders" size={19} color={colors.foreground} />
          </Pressable>
        </View>

        <View style={[styles.heroCard, { backgroundColor: colors.hero }]}>
          <View style={styles.heroGlow} />
          <View style={styles.heroHeader}>
            <View style={styles.medicationTitleWrap}>
              <View style={[styles.pillIcon, { backgroundColor: colors.accent }]}>
                <Feather name="plus" size={18} color={colors.primary} />
              </View>
              <View>
                <Text style={[styles.heroLabel, { color: colors.heroText }]}>TODAY'S MEDICATION</Text>
                <Text style={[styles.medicationName, { color: colors.heroText }]}>{medication.name}</Text>
                <Text style={[styles.medicationDose, { color: colors.accent }]}>{medication.dose} · {medication.schedule}</Text>
              </View>
            </View>
            <View style={[styles.activeBadge, { backgroundColor: colors.heroSoft }]}>
              <View style={[styles.activeDot, { backgroundColor: colors.success }]} />
              <Text style={[styles.activeText, { color: colors.heroText }]}>Active</Text>
            </View>
          </View>
          <View style={[styles.heroDivider, { backgroundColor: colors.heroSoft }]} />
          <View style={styles.nextDoseRow}>
            <View>
              <Text style={[styles.nextLabel, { color: colors.accent }]}>NEXT DOSE</Text>
              <Text style={[styles.nextTime, { color: colors.heroText }]}>{medication.next}</Text>
            </View>
            <View style={styles.reminderMini}>
              <Feather name="bell" size={15} color={colors.accent} />
              <Text style={[styles.reminderMiniText, { color: colors.heroText }]}>{remindersOn ? 'Reminder on' : 'Reminder off'}</Text>
            </View>
          </View>
        </View>

        <View style={styles.sectionHeader}>
          <View>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Your day</Text>
            <Text style={[styles.sectionSubtle, { color: colors.mutedForeground }]}>Stay on track, one dose at a time.</Text>
          </View>
          <Text style={[styles.datePill, { color: colors.primary, backgroundColor: colors.accent }]}>2 doses</Text>
        </View>

        <View style={styles.metricsRow}>
          <View style={[styles.metricCard, { backgroundColor: colors.card }]}>
            <View style={styles.metricTopLine}>
              <Text style={[styles.metricLabel, { color: colors.mutedForeground }]}>ADHERENCE</Text>
              <Feather name="activity" size={16} color={colors.primary} />
            </View>
            <Text style={[styles.metricValue, { color: colors.foreground }]}>{adherence}%</Text>
            <Text style={[styles.metricHint, { color: colors.success }]}>Looking good</Text>
          </View>
          <View style={[styles.metricCard, { backgroundColor: colors.card }]}>
            <View style={styles.metricTopLine}>
              <Text style={[styles.metricLabel, { color: colors.mutedForeground }]}>STREAK</Text>
              <Feather name="zap" size={16} color={colors.warning} />
            </View>
            <Text style={[styles.metricValue, { color: colors.foreground }]}>6 <Text style={styles.metricUnit}>days</Text></Text>
            <Text style={[styles.metricHint, { color: colors.mutedForeground }]}>Keep it going</Text>
          </View>
        </View>

        <Pressable
          accessibilityLabel="Scan NFC tag to log dose"
          testID="scan-nfc-button"
          onPress={openScan}
          style={({ pressed }) => [styles.scanButton, { backgroundColor: colors.primary, opacity: pressed ? 0.83 : 1 }]}
        >
          <View style={[styles.scanButtonIcon, { backgroundColor: colors.secondary }]}>
            <Feather name="radio" size={23} color={colors.primary} />
          </View>
          <View style={styles.scanButtonCopy}>
            <Text style={[styles.scanButtonTitle, { color: colors.primaryForeground }]}>Scan to log dose</Text>
            <Text style={[styles.scanButtonSubtitle, { color: colors.accent }]}>Hold your phone near the NFC tag</Text>
          </View>
          <Feather name="arrow-up-right" size={20} color={colors.primaryForeground} />
        </Pressable>

        <View style={styles.sectionHeaderHistory}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>{showHistory ? 'Dose history' : 'Today'}</Text>
          <Pressable testID="history-toggle" onPress={() => setShowHistory((current) => !current)} hitSlop={10}>
            <Text style={[styles.linkText, { color: colors.primary }]}>{showHistory ? 'Show less' : 'See history'}</Text>
          </Pressable>
        </View>

        <View style={[styles.timeline, { backgroundColor: colors.card }]}>
          {(showHistory ? sortedDoses : sortedDoses.filter((dose) => dose.date === todayKey()).slice(0, 3)).map((dose, index, array) => (
            <View key={dose.id} style={styles.timelineItem}>
              <View style={styles.timelineRail}>
                <View style={[styles.timelineDot, { backgroundColor: dose.source === 'NFC' ? colors.primary : colors.success }]}>
                  <Feather name="check" size={11} color={colors.primaryForeground} />
                </View>
                {index < array.length - 1 && <View style={[styles.timelineLine, { backgroundColor: colors.border }]} />}
              </View>
              <View style={styles.timelineContent}>
                <View style={styles.timelineTextWrap}>
                  <Text style={[styles.timelineTitle, { color: colors.foreground }]}>{dose.label}</Text>
                  <Text style={[styles.timelineMeta, { color: colors.mutedForeground }]}>{dose.time} · {dose.source === 'NFC' ? 'NFC tag' : 'Marked complete'}</Text>
                </View>
                <Feather name="check-circle" size={18} color={colors.success} />
              </View>
            </View>
          ))}
          {sortedDoses.filter((dose) => dose.date === todayKey()).length === 0 && (
            <View style={styles.emptyState}>
              <Feather name="sun" size={22} color={colors.mutedForeground} />
              <Text style={[styles.emptyTitle, { color: colors.foreground }]}>No doses logged yet</Text>
              <Text style={[styles.emptySubtitle, { color: colors.mutedForeground }]}>Your first scan will appear here.</Text>
            </View>
          )}
        </View>

        <View style={[styles.reminderCard, { backgroundColor: colors.secondary }]}>
          <View style={[styles.reminderIcon, { backgroundColor: colors.card }]}>
            <Feather name="bell" size={18} color={colors.primary} />
          </View>
          <View style={styles.reminderCopy}>
            <Text style={[styles.reminderTitle, { color: colors.foreground }]}>Daily reminder</Text>
            <Text style={[styles.reminderSubtitle, { color: colors.mutedForeground }]}>A gentle nudge at {medication.next}</Text>
          </View>
          <Switch
            testID="reminder-switch"
            value={remindersOn}
            onValueChange={(value) => { setRemindersOn(value); Haptics.selectionAsync().catch(() => undefined); }}
            trackColor={{ false: colors.border, true: colors.primary }}
            thumbColor={colors.white}
          />
        </View>
      </ScrollView>

      <Modal visible={scanVisible} transparent animationType="slide" onRequestClose={closeScan}>
        <View style={styles.modalBackdrop}>
          <View style={[styles.scanSheet, { backgroundColor: colors.card, paddingBottom: bottomInset }]}>
            <View style={[styles.sheetHandle, { backgroundColor: colors.border }]} />
            <Pressable onPress={closeScan} style={styles.closeButton} accessibilityLabel="Close NFC scanner">
              <Feather name="x" size={20} color={colors.foreground} />
            </Pressable>
            {scanState === 'success' ? (
              <View style={styles.scanResult}>
                <View style={[styles.successCircle, { backgroundColor: colors.accent }]}><Feather name="check" size={31} color={colors.primary} /></View>
                <Text style={[styles.sheetTitle, { color: colors.foreground }]}>Dose logged</Text>
                <Text style={[styles.sheetDescription, { color: colors.mutedForeground }]}>Nice work. Your {medication.name} dose was recorded at {formatNow()}.</Text>
                <Pressable testID="done-scan-button" onPress={closeScan} style={[styles.sheetPrimaryButton, { backgroundColor: colors.primary }]}><Text style={[styles.sheetPrimaryText, { color: colors.primaryForeground }]}>Done</Text></Pressable>
              </View>
            ) : (
              <View style={styles.scanResult}>
                <View style={[styles.nfcOrb, { backgroundColor: colors.hero }]}>
                  <View style={[styles.orbRing, { borderColor: colors.accent }]}><Feather name="radio" size={34} color={colors.accent} /></View>
                </View>
                <Text style={[styles.sheetTitle, { color: colors.foreground }]}>{scanState === 'scanning' ? 'Ready to scan' : 'Scan your medication'}</Text>
                <Text style={[styles.sheetDescription, { color: colors.mutedForeground }]}>Place the top of your phone close to the NFC tag on your medication container.</Text>
                {scanState === 'scanning' && <View style={styles.scanStatusRow}><View style={[styles.statusDot, { backgroundColor: colors.success }]} /><Text style={[styles.scanStatus, { color: colors.primary }]}>Listening for a tag…</Text></View>}
                <Pressable testID="preview-log-dose-button" onPress={handlePreviewScan} style={({ pressed }) => [styles.sheetPrimaryButton, { backgroundColor: colors.primary, opacity: pressed ? 0.8 : 1 }]}><Feather name="radio" size={18} color={colors.primaryForeground} /><Text style={[styles.sheetPrimaryText, { color: colors.primaryForeground }]}>Tap to simulate scan</Text></Pressable>
                <Text style={[styles.previewNote, { color: colors.mutedForeground }]}>Preview mode: use this button to test the logging flow.</Text>
              </View>
            )}
          </View>
        </View>
      </Modal>

      <Modal visible={settingsVisible} transparent animationType="slide" onRequestClose={() => setSettingsVisible(false)}>
        <View style={styles.modalBackdrop}>
          <View style={[styles.settingsSheet, { backgroundColor: colors.card, paddingBottom: bottomInset }]}>
            <View style={[styles.sheetHandle, { backgroundColor: colors.border }]} />
            <View style={styles.settingsHeader}><Text style={[styles.sheetTitle, { color: colors.foreground }]}>Medication settings</Text><Pressable onPress={() => setSettingsVisible(false)} accessibilityLabel="Close settings"><Feather name="x" size={20} color={colors.foreground} /></Pressable></View>
            <View style={[styles.settingRow, { borderBottomColor: colors.border }]}><View><Text style={[styles.settingTitle, { color: colors.foreground }]}>Medication</Text><Text style={[styles.settingValue, { color: colors.mutedForeground }]}>{medication.name} · {medication.dose}</Text></View><Feather name="chevron-right" size={18} color={colors.mutedForeground} /></View>
            <View style={[styles.settingRow, { borderBottomColor: colors.border }]}><View><Text style={[styles.settingTitle, { color: colors.foreground }]}>Reminder time</Text><Text style={[styles.settingValue, { color: colors.mutedForeground }]}>{medication.next}</Text></View><Feather name="chevron-right" size={18} color={colors.mutedForeground} /></View>
            <View style={[styles.settingRow, { borderBottomColor: colors.border }]}><View><Text style={[styles.settingTitle, { color: colors.foreground }]}>NFC tag</Text><Text style={[styles.settingValue, { color: colors.mutedForeground }]}>Connected and ready</Text></View><View style={[styles.connectedBadge, { backgroundColor: colors.accent }]}><Text style={[styles.connectedText, { color: colors.primary }]}>Ready</Text></View></View>
            <Pressable onPress={() => { setSettingsVisible(false); Alert.alert('All set', 'Meditap is ready to help you stay on track.'); }} style={[styles.sheetPrimaryButton, { backgroundColor: colors.primary }]}><Text style={[styles.sheetPrimaryText, { color: colors.primaryForeground }]}>Done</Text></Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  scrollContent: { paddingHorizontal: 20 },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 22 },
  eyebrow: { fontFamily: sansSerifFont, fontSize: 11, fontWeight: '700', letterSpacing: 1.2, marginBottom: 7 },
  greeting: { fontFamily: sansSerifFont, fontSize: 29, fontWeight: '700', letterSpacing: -0.8 },
  iconButton: { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center', shadowColor: '#17212b', shadowOpacity: 0.05, shadowRadius: 12, shadowOffset: { width: 0, height: 5 }, elevation: 2 },
  heroCard: { borderRadius: 28, padding: 22, overflow: 'hidden', marginBottom: 27, shadowColor: '#12343b', shadowOpacity: 0.16, shadowRadius: 18, shadowOffset: { width: 0, height: 10 }, elevation: 6 },
  heroGlow: { position: 'absolute', width: 180, height: 180, borderRadius: 90, backgroundColor: '#2b6d70', opacity: 0.33, right: -66, top: -83 },
  heroHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  medicationTitleWrap: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  pillIcon: { width: 46, height: 46, borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginRight: 13 },
  heroLabel: { fontFamily: sansSerifFont, fontSize: 10, fontWeight: '700', letterSpacing: 1.1, opacity: 0.7, marginBottom: 4 },
  medicationName: { fontFamily: sansSerifFont, fontSize: 21, fontWeight: '700', letterSpacing: -0.3 },
  medicationDose: { fontFamily: sansSerifFont, fontSize: 12, fontWeight: '500', marginTop: 4 },
  activeBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 9, paddingVertical: 6, borderRadius: 16, marginLeft: 8 },
  activeDot: { width: 6, height: 6, borderRadius: 3, marginRight: 5 },
  activeText: { fontFamily: sansSerifFont, fontSize: 10, fontWeight: '600' },
  heroDivider: { height: 1, opacity: 0.8, marginTop: 21, marginBottom: 17 },
  nextDoseRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
  nextLabel: { fontFamily: sansSerifFont, fontSize: 10, fontWeight: '700', letterSpacing: 1.1, opacity: 0.8, marginBottom: 5 },
  nextTime: { fontFamily: sansSerifFont, fontSize: 30, fontWeight: '700', letterSpacing: -1 },
  reminderMini: { flexDirection: 'row', alignItems: 'center', paddingBottom: 4 },
  reminderMiniText: { fontFamily: sansSerifFont, fontSize: 12, fontWeight: '600', marginLeft: 7, opacity: 0.9 },
  sectionHeader: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 14 },
  sectionTitle: { fontFamily: sansSerifFont, fontSize: 20, fontWeight: '700', letterSpacing: -0.3 },
  sectionSubtle: { fontFamily: sansSerifFont, fontSize: 13, marginTop: 4 },
  datePill: { fontFamily: sansSerifFont, fontSize: 12, fontWeight: '700', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 13 },
  metricsRow: { flexDirection: 'row', gap: 12, marginBottom: 14 },
  metricCard: { flex: 1, minHeight: 107, borderRadius: 20, padding: 15, shadowColor: '#17212b', shadowOpacity: 0.04, shadowRadius: 10, shadowOffset: { width: 0, height: 4 }, elevation: 1 },
  metricTopLine: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  metricLabel: { fontFamily: sansSerifFont, fontSize: 10, fontWeight: '700', letterSpacing: 0.9 },
  metricValue: { fontFamily: sansSerifFont, fontSize: 27, fontWeight: '700', marginTop: 8, letterSpacing: -0.8 },
  metricUnit: { fontFamily: sansSerifFont, fontSize: 13, fontWeight: '600', letterSpacing: 0 },
  metricHint: { fontFamily: sansSerifFont, fontSize: 11, fontWeight: '600', marginTop: 1 },
  scanButton: { minHeight: 76, borderRadius: 22, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 12, marginBottom: 28 },
  scanButtonIcon: { width: 52, height: 52, borderRadius: 17, alignItems: 'center', justifyContent: 'center', marginRight: 13 },
  scanButtonCopy: { flex: 1 },
  scanButtonTitle: { fontFamily: sansSerifFont, fontSize: 16, fontWeight: '700', marginBottom: 4 },
  scanButtonSubtitle: { fontFamily: sansSerifFont, fontSize: 11, fontWeight: '500' },
  sectionHeaderHistory: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 13 },
  linkText: { fontFamily: sansSerifFont, fontSize: 13, fontWeight: '700' },
  timeline: { borderRadius: 21, paddingHorizontal: 17, paddingVertical: 4, marginBottom: 14 },
  timelineItem: { flexDirection: 'row', minHeight: 70 },
  timelineRail: { width: 28, alignItems: 'center' },
  timelineDot: { width: 22, height: 22, borderRadius: 11, alignItems: 'center', justifyContent: 'center', marginTop: 16, zIndex: 1 },
  timelineLine: { width: 1, flex: 1, marginTop: -1 },
  timelineContent: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingLeft: 11, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#edf3f2' },
  timelineTextWrap: { flex: 1 },
  timelineTitle: { fontFamily: sansSerifFont, fontSize: 14, fontWeight: '600', marginBottom: 5 },
  timelineMeta: { fontFamily: sansSerifFont, fontSize: 12 },
  emptyState: { alignItems: 'center', paddingVertical: 27 },
  emptyTitle: { fontFamily: sansSerifFont, fontSize: 14, fontWeight: '700', marginTop: 10 },
  emptySubtitle: { fontFamily: sansSerifFont, fontSize: 12, marginTop: 5 },
  reminderCard: { borderRadius: 20, padding: 14, flexDirection: 'row', alignItems: 'center' },
  reminderIcon: { width: 39, height: 39, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginRight: 11 },
  reminderCopy: { flex: 1 },
  reminderTitle: { fontFamily: sansSerifFont, fontSize: 14, fontWeight: '700', marginBottom: 4 },
  reminderSubtitle: { fontFamily: sansSerifFont, fontSize: 11 },
  modalBackdrop: { flex: 1, justifyContent: 'flex-end', backgroundColor: theme.light.overlay },
  scanSheet: { borderTopLeftRadius: 29, borderTopRightRadius: 29, paddingHorizontal: 22, paddingTop: 13, minHeight: 430 },
  settingsSheet: { borderTopLeftRadius: 29, borderTopRightRadius: 29, paddingHorizontal: 22, paddingTop: 13 },
  sheetHandle: { alignSelf: 'center', width: 37, height: 5, borderRadius: 3, marginBottom: 8 },
  closeButton: { position: 'absolute', right: 20, top: 20, width: 34, height: 34, borderRadius: 17, backgroundColor: '#edf3f2', alignItems: 'center', justifyContent: 'center' },
  scanResult: { alignItems: 'center', paddingTop: 20 },
  nfcOrb: { width: 136, height: 136, borderRadius: 68, alignItems: 'center', justifyContent: 'center', marginBottom: 21 },
  orbRing: { width: 93, height: 93, borderRadius: 48, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  successCircle: { width: 74, height: 74, borderRadius: 37, alignItems: 'center', justifyContent: 'center', marginBottom: 23, marginTop: 21 },
  sheetTitle: { fontFamily: sansSerifFont, fontSize: 24, fontWeight: '700', letterSpacing: -0.5 },
  sheetDescription: { fontFamily: sansSerifFont, fontSize: 14, lineHeight: 21, textAlign: 'center', maxWidth: 310, marginTop: 10 },
  scanStatusRow: { flexDirection: 'row', alignItems: 'center', marginTop: 18 },
  statusDot: { width: 7, height: 7, borderRadius: 4, marginRight: 7 },
  scanStatus: { fontFamily: sansSerifFont, fontSize: 12, fontWeight: '700' },
  sheetPrimaryButton: { width: '100%', minHeight: 54, borderRadius: 18, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', marginTop: 25 },
  sheetPrimaryText: { fontFamily: sansSerifFont, fontSize: 15, fontWeight: '700', marginLeft: 8 },
  previewNote: { fontFamily: sansSerifFont, fontSize: 11, marginTop: 12, textAlign: 'center' },
  settingsHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 16, marginBottom: 12 },
  settingRow: { minHeight: 68, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderBottomWidth: StyleSheet.hairlineWidth },
  settingTitle: { fontFamily: sansSerifFont, fontSize: 15, fontWeight: '600', marginBottom: 5 },
  settingValue: { fontFamily: sansSerifFont, fontSize: 12 },
  connectedBadge: { borderRadius: 10, paddingHorizontal: 9, paddingVertical: 5 },
  connectedText: { fontFamily: sansSerifFont, fontSize: 11, fontWeight: '700' },
});
