// src/screens/PPGDetails.js
import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, Alert, RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const API = 'http://122.165.125.56:5030/api';

// ── Dropdown ────────────────────────────────────────────────────────────────
function Dropdown({ label, value, options, onSelect, disabled, loading }) {
  const [open, setOpen] = useState(false);
  const selected = options.find((o) => o.value === value);

  return (
    <View style={dd.wrapper}>
      <Text style={dd.label}>{label}</Text>
      <TouchableOpacity
        style={[dd.btn, disabled && dd.disabled]}
        onPress={() => !disabled && setOpen((v) => !v)}
        activeOpacity={0.75}
      >
        <Text style={[dd.txt, !selected && dd.ph]} numberOfLines={1}>
          {loading ? 'Loading…' : selected ? selected.label : `Select ${label}`}
        </Text>
        {loading
          ? <ActivityIndicator size="small" color="#2E7D32" />
          : <Text style={dd.arrow}>{open ? '▲' : '▼'}</Text>}
      </TouchableOpacity>

      {open && (
        <View style={dd.list}>
          <TouchableOpacity style={dd.item} onPress={() => { onSelect(null); setOpen(false); }}>
            <Text style={dd.clear}>✕  Clear</Text>
          </TouchableOpacity>
          {options.map((opt) => (
            <TouchableOpacity
              key={opt.value}
              style={[dd.item, opt.value === value && dd.itemSel]}
              onPress={() => { onSelect(opt.value); setOpen(false); }}
            >
              <Text style={[dd.itemTxt, opt.value === value && dd.itemTxtSel]}>
                {opt.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );
}

// ── PPG Card ────────────────────────────────────────────────────────────────
function PPGCard({ ppg }) {
  const rows = [
    { label: 'State',    value: ppg.state_sname    || ppg.state_scode },
    { label: 'District', value: ppg.district_dname || ppg.district_dcode },
    { label: 'Location', value: ppg.location_lname || ppg.location_lcode },
    { label: 'Cluster',  value: ppg.cluster_cname  || ppg.cluster_ccode },
    { label: 'Bank',     value: ppg.bank_name },
    { label: 'A/C No.',  value: ppg.ppg_ac_no },
    { label: 'IFSC',     value: ppg.ifsc_code },
  ];

  return (
    <View style={s.card}>
      <View style={s.cardTop}>
        <View style={s.badge}><Text style={s.badgeTxt}>{ppg.ppg_code}</Text></View>
        <View style={s.dot} />
      </View>
      <Text style={s.cardName}>{ppg.ppg_name}</Text>
      <View style={s.divider} />
      {rows.map(({ label, value }) =>
        value ? (
          <View key={label} style={s.row}>
            <Text style={s.rowLabel}>{label}</Text>
            <Text style={s.rowValue} numberOfLines={1}>{value}</Text>
          </View>
        ) : null
      )}
    </View>
  );
}

// ── Screen ──────────────────────────────────────────────────────────────────
export default function PPGDetails() {
  const [states,    setStates]    = useState([]);
  const [districts, setDistricts] = useState([]);
  const [locations, setLocations] = useState([]);
  const [clusters,  setClusters]  = useState([]);
  const [ppgList,   setPpgList]   = useState([]);

  const [selState,    setSelState]    = useState(null);
  const [selDistrict, setSelDistrict] = useState(null);
  const [selLocation, setSelLocation] = useState(null);
  const [selCluster,  setSelCluster]  = useState(null);

  const [ldStates,    setLdStates]    = useState(false);
  const [ldDistricts, setLdDistricts] = useState(false);
  const [ldLocations, setLdLocations] = useState(false);
  const [ldClusters,  setLdClusters]  = useState(false);
  const [ldPPG,       setLdPPG]       = useState(false);
  const [refreshing,  setRefreshing]  = useState(false);

  // load states on mount
  useEffect(() => { loadStates(); }, []);

  // cascades
  useEffect(() => {
    setSelDistrict(null); setSelLocation(null); setSelCluster(null);
    setDistricts([]); setLocations([]); setClusters([]); setPpgList([]);
    if (selState) loadDistricts(selState);
  }, [selState]);

  useEffect(() => {
    setSelLocation(null); setSelCluster(null);
    setLocations([]); setClusters([]); setPpgList([]);
    if (selDistrict) loadLocations(selDistrict);
  }, [selDistrict]);

  useEffect(() => {
    setSelCluster(null); setClusters([]); setPpgList([]);
    if (selLocation) loadClusters(selLocation);
  }, [selLocation]);

  useEffect(() => {
    setPpgList([]);
    if (selCluster) loadPPG(selCluster);
  }, [selCluster]);

  async function loadStates() {
    setLdStates(true);
    try {
      const r = await fetch(`${API}/states`);
      const j = await r.json();
      setStates((j.data || []).map(x => ({ value: x.state_scode, label: x.state_sname })));
    } catch { Alert.alert('Error', 'Cannot load states'); }
    finally { setLdStates(false); }
  }

  async function loadDistricts(code) {
    setLdDistricts(true);
    try {
      const r = await fetch(`${API}/districts/${code}`);
      const j = await r.json();
      setDistricts((j.data || []).map(x => ({ value: x.district_dcode, label: x.district_dname })));
    } catch { Alert.alert('Error', 'Cannot load districts'); }
    finally { setLdDistricts(false); }
  }

  async function loadLocations(code) {
    setLdLocations(true);
    try {
      const r = await fetch(`${API}/locations/${code}`);
      const j = await r.json();
      setLocations((j.data || []).map(x => ({ value: x.location_lcode, label: x.location_lname })));
    } catch { Alert.alert('Error', 'Cannot load locations'); }
    finally { setLdLocations(false); }
  }

  async function loadClusters(code) {
    setLdClusters(true);
    try {
      const r = await fetch(`${API}/clusters/${code}`);
      const j = await r.json();
      setClusters((j.data || []).map(x => ({ value: x.cluster_ccode, label: x.cluster_cname })));
    } catch { Alert.alert('Error', 'Cannot load clusters'); }
    finally { setLdClusters(false); }
  }

  async function loadPPG(clusterCode) {
    setLdPPG(true);
    try {
      // uses query param so we can re-use the existing GET /api/ppg/members?cluster=...
      const r = await fetch(`${API}/ppg/members?cluster=${clusterCode}`);
      const j = await r.json();
      setPpgList(j.data || []);
    } catch { Alert.alert('Error', 'Cannot load PPG records'); }
    finally { setLdPPG(false); }
  }

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadStates();
    if (selCluster) await loadPPG(selCluster);
    setRefreshing(false);
  }, [selCluster]);

  const hasFilter = selState || selDistrict || selLocation || selCluster;

  const clearAll = () => {
    setSelState(null); setSelDistrict(null);
    setSelLocation(null); setSelCluster(null);
  };

  return (
    <SafeAreaView style={s.safe} edges={['bottom']}>
      <ScrollView
        contentContainerStyle={s.scroll}
        keyboardShouldPersistTaps="handled"
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#2E7D32']} />}
      >
        {/* Filter panel */}
        <View style={s.panel}>
          <Text style={s.panelTitle}>Filter PPG Records</Text>
          <Dropdown label="State"    value={selState}    options={states}    onSelect={setSelState}    loading={ldStates} />
          <Dropdown label="District" value={selDistrict} options={districts} onSelect={setSelDistrict} disabled={!selState}    loading={ldDistricts} />
          <Dropdown label="Location" value={selLocation} options={locations} onSelect={setSelLocation} disabled={!selDistrict} loading={ldLocations} />
          <Dropdown label="Cluster"  value={selCluster}  options={clusters}  onSelect={setSelCluster}  disabled={!selLocation} loading={ldClusters} />

          {hasFilter && (
            <TouchableOpacity style={s.clearBtn} onPress={clearAll}>
              <Text style={s.clearTxt}>✕  Clear all filters</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Results */}
        {ldPPG ? (
          <ActivityIndicator size="large" color="#2E7D32" style={{ marginTop: 32 }} />
        ) : ppgList.length > 0 ? (
          <>
            <Text style={s.count}>{ppgList.length} PPG{ppgList.length !== 1 ? 's' : ''} found</Text>
            {ppgList.map((ppg) => <PPGCard key={ppg.ppg_code || ppg.id} ppg={ppg} />)}
          </>
        ) : selCluster ? (
          <View style={s.empty}>
            <Text style={s.emptyIcon}>🌿</Text>
            <Text style={s.emptyTitle}>No PPGs in this cluster</Text>
            <Text style={s.emptySub}>Add a new PPG to get started.</Text>
          </View>
        ) : (
          <View style={s.empty}>
            <Text style={s.emptyIcon}>📋</Text>
            <Text style={s.emptyTitle}>Select filters above</Text>
            <Text style={s.emptySub}>Choose State → District → Location → Cluster to view PPG records.</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

// ── Dropdown styles ──────────────────────────────────────────────────────────
const dd = StyleSheet.create({
  wrapper: { marginBottom: 12, zIndex: 10 },
  label:   { fontSize: 13, color: '#555', fontWeight: '500', marginBottom: 4 },
  btn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    borderWidth: 1, borderColor: '#DDD', borderRadius: 10,
    paddingHorizontal: 12, paddingVertical: 10, backgroundColor: '#FAFAFA',
  },
  disabled: { opacity: 0.45 },
  txt:      { fontSize: 14, color: '#222', flex: 1 },
  ph:       { color: '#AAA' },
  arrow:    { fontSize: 11, color: '#888', marginLeft: 8 },
  list: {
    position: 'absolute', top: '100%', left: 0, right: 0,
    backgroundColor: '#fff', borderWidth: 1, borderColor: '#DDD',
    borderRadius: 10, zIndex: 999, elevation: 8, maxHeight: 200,
    overflow: 'scroll', marginTop: 2,
  },
  item:       { paddingHorizontal: 14, paddingVertical: 11 },
  itemSel:    { backgroundColor: '#E8F5E9' },
  itemTxt:    { fontSize: 14, color: '#333' },
  itemTxtSel: { color: '#2E7D32', fontWeight: '600' },
  clear:      { fontSize: 13, color: '#E53935' },
});

// ── Screen styles ────────────────────────────────────────────────────────────
const GREEN = '#2E7D32';
const s = StyleSheet.create({
  safe:   { flex: 1, backgroundColor: '#F5F5F5' },
  scroll: { padding: 16, paddingBottom: 40 },

  panel: {
    backgroundColor: '#fff', borderRadius: 16, padding: 16,
    marginBottom: 16, elevation: 1,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06, shadowRadius: 4,
  },
  panelTitle: {
    fontSize: 13, fontWeight: '600', color: '#888',
    letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: 14,
  },
  clearBtn: {
    marginTop: 6, alignSelf: 'flex-start',
    paddingHorizontal: 12, paddingVertical: 6,
    borderRadius: 20, backgroundColor: '#FBE9E7',
  },
  clearTxt: { fontSize: 13, color: '#E53935', fontWeight: '500' },

  count: { fontSize: 13, color: '#888', marginBottom: 12, fontWeight: '500' },

  card: {
    backgroundColor: '#fff', borderRadius: 14, padding: 16,
    marginBottom: 12, elevation: 1,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06, shadowRadius: 4,
  },
  cardTop:  { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  badge:    { backgroundColor: '#E8F5E9', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  badgeTxt: { fontSize: 11, color: GREEN, fontWeight: '700', letterSpacing: 0.5 },
  dot:      { width: 8, height: 8, borderRadius: 4, backgroundColor: '#43A047' },
  cardName: { fontSize: 16, fontWeight: '700', color: '#1A1A1A', marginBottom: 10 },
  divider:  { height: 1, backgroundColor: '#F0F0F0', marginBottom: 10 },
  row:      { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 3 },
  rowLabel: { fontSize: 13, color: '#888' },
  rowValue: { fontSize: 13, color: '#333', fontWeight: '500', maxWidth: '65%', textAlign: 'right' },

  empty:     { alignItems: 'center', paddingVertical: 48, paddingHorizontal: 24 },
  emptyIcon: { fontSize: 40, marginBottom: 12 },
  emptyTitle:{ fontSize: 16, fontWeight: '600', color: '#333', marginBottom: 6 },
  emptySub:  { fontSize: 13, color: '#888', textAlign: 'center', lineHeight: 20 },
});