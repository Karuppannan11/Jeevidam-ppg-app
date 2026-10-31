// src/screens/FPODetails.js
import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, Alert, RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const API = 'http://192.168.101.118:5030/api';

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
          ? <ActivityIndicator size="small" color="#1565C0" />
          : <Text style={dd.arrow}>{open ? '▲' : '▼'}</Text>}
      </TouchableOpacity>

      {open && (
        <View style={dd.list}>
          <ScrollView 
            style={dd.listScroll}
            showsVerticalScrollIndicator={true}
            nestedScrollEnabled={true}
          >
            <TouchableOpacity 
              style={[dd.item, dd.clearItem]} 
              onPress={() => { onSelect(null); setOpen(false); }}
            >
              <Text style={dd.clear}>✕  Clear</Text>
            </TouchableOpacity>
            {options.map((opt, index) => (
              <TouchableOpacity
                key={opt.value}
                style={[
                  dd.item, 
                  opt.value === value && dd.itemSel,
                  index === options.length - 1 && dd.itemLast
                ]}
                onPress={() => { onSelect(opt.value); setOpen(false); }}
              >
                <Text style={[dd.itemTxt, opt.value === value && dd.itemTxtSel]}>
                  {opt.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}
    </View>
  );
}

// ── Member row ──────────────────────────────────────────────────────────────
function MemberRow({ member, index, selected, onPress }) {
  return (
    <TouchableOpacity
      style={[s.memberRow, selected && s.memberRowSel]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={[s.avatar, selected && s.avatarSel]}>
        <Text style={[s.avatarTxt, selected && s.avatarTxtSel]}>
          {String(index + 1).padStart(2, '0')}
        </Text>
      </View>
      <View style={s.memberMid}>
        <Text style={s.memberCode}>{member.unique_id}</Text>
        <Text style={s.memberGroup}>{member.group_cname || member.group_gcode}</Text>
      </View>
      <Text style={s.memberMcode}>{member.member_mcode}</Text>
    </TouchableOpacity>
  );
}

// ── Screen ──────────────────────────────────────────────────────────────────
export default function FPODetails() {
  const [states,    setStates]    = useState([]);
  const [districts, setDistricts] = useState([]);
  const [locations, setLocations] = useState([]);
  const [clusters,  setClusters]  = useState([]);
  const [groups,    setGroups]    = useState([]);
  const [ppgList,   setPpgList]   = useState([]);
  const [members,   setMembers]   = useState([]);

  const [selState,    setSelState]    = useState(null);
  const [selDistrict, setSelDistrict] = useState(null);
  const [selLocation, setSelLocation] = useState(null);
  const [selCluster,  setSelCluster]  = useState(null);
  const [selGroup,    setSelGroup]    = useState(null);
  const [selPPG,      setSelPPG]      = useState(null);
  const [selMember,   setSelMember]   = useState(null);

  const [ldStates,    setLdStates]    = useState(false);
  const [ldDistricts, setLdDistricts] = useState(false);
  const [ldLocations, setLdLocations] = useState(false);
  const [ldClusters,  setLdClusters]  = useState(false);
  const [ldGroups,    setLdGroups]    = useState(false);
  const [ldPPG,       setLdPPG]       = useState(false);
  const [ldMembers,   setLdMembers]   = useState(false);
  const [refreshing,  setRefreshing]  = useState(false);

  useEffect(() => { loadStates(); }, []);

  useEffect(() => {
    setSelDistrict(null); setSelLocation(null); setSelCluster(null);
    setSelGroup(null); setSelPPG(null); setSelMember(null);
    setDistricts([]); setLocations([]); setClusters([]);
    setGroups([]); setPpgList([]); setMembers([]);
    if (selState) loadDistricts(selState);
  }, [selState]);

  useEffect(() => {
    setSelLocation(null); setSelCluster(null); setSelGroup(null);
    setSelPPG(null); setSelMember(null);
    setLocations([]); setClusters([]); setGroups([]); setPpgList([]); setMembers([]);
    if (selDistrict) loadLocations(selDistrict);
  }, [selDistrict]);

  useEffect(() => {
    setSelCluster(null); setSelGroup(null); setSelPPG(null); setSelMember(null);
    setClusters([]); setGroups([]); setPpgList([]); setMembers([]);
    if (selLocation) loadClusters(selLocation);
  }, [selLocation]);

  useEffect(() => {
    setSelGroup(null); setSelPPG(null); setSelMember(null);
    setGroups([]); setPpgList([]); setMembers([]);
    if (selCluster) {
      loadGroups(selCluster);
      loadPPG(selCluster);
      loadMembersByCluster(selCluster);
    }
  }, [selCluster]);

  // When group selected → filter members by group
  useEffect(() => {
    setSelMember(null);
    if (selGroup) loadMembersByGroup(selGroup);
    else if (selCluster) loadMembersByCluster(selCluster);
  }, [selGroup]);

  // When PPG selected → filter members by PPG's cluster (already loaded)
  useEffect(() => {
    setSelMember(null);
  }, [selPPG]);

  async function loadStates() {
    setLdStates(true);
    try {
      const j = await fetch(`${API}/states`).then(r => r.json());
      setStates((j.data || []).map(x => ({ value: x.state_scode, label: x.state_sname })));
    } catch { Alert.alert('Error', 'Cannot load states'); }
    finally { setLdStates(false); }
  }

  async function loadDistricts(code) {
    setLdDistricts(true);
    try {
      const j = await fetch(`${API}/districts/${code}`).then(r => r.json());
      setDistricts((j.data || []).map(x => ({ value: x.district_dcode, label: x.district_dname })));
    } catch { Alert.alert('Error', 'Cannot load districts'); }
    finally { setLdDistricts(false); }
  }

  async function loadLocations(code) {
    setLdLocations(true);
    try {
      const j = await fetch(`${API}/locations/${code}`).then(r => r.json());
      setLocations((j.data || []).map(x => ({ value: x.location_lcode, label: x.location_lname })));
    } catch { Alert.alert('Error', 'Cannot load locations'); }
    finally { setLdLocations(false); }
  }

  async function loadClusters(code) {
    setLdClusters(true);
    try {
      const j = await fetch(`${API}/clusters/${code}`).then(r => r.json());
      setClusters((j.data || []).map(x => ({ value: x.cluster_ccode, label: x.cluster_cname })));
    } catch { Alert.alert('Error', 'Cannot load clusters'); }
    finally { setLdClusters(false); }
  }

  async function loadGroups(clusterCode) {
    setLdGroups(true);
    try {
      const j = await fetch(`${API}/groups/${clusterCode}`).then(r => r.json());
      setGroups((j.data || []).map(x => ({ value: x.group_gcode, label: x.group_cname })));
    } catch { Alert.alert('Error', 'Cannot load groups'); }
    finally { setLdGroups(false); }
  }

  async function loadPPG(clusterCode) {
    setLdPPG(true);
    try {
      const j = await fetch(`${API}/ppg/by-cluster/${clusterCode}`).then(r => r.json());
      setPpgList((j.data || []).map(x => ({ value: x.ppg_code, label: x.ppg_name, id: x.id })));
    } catch { Alert.alert('Error', 'Cannot load PPGs'); }
    finally { setLdPPG(false); }
  }

  async function loadMembersByCluster(clusterCode) {
    setLdMembers(true);
    try {
      const j = await fetch(`${API}/members/by-cluster/${clusterCode}`).then(r => r.json());
      setMembers(j.data || []);
    } catch { Alert.alert('Error', 'Cannot load members'); }
    finally { setLdMembers(false); }
  }

  async function loadMembersByGroup(groupCode) {
    setLdMembers(true);
    try {
      const j = await fetch(`${API}/members/by-group/${groupCode}`).then(r => r.json());
      setMembers(j.data || []);
    } catch { Alert.alert('Error', 'Cannot load members'); }
    finally { setLdMembers(false); }
  }

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadStates();
    if (selCluster) {
      await loadGroups(selCluster);
      await loadPPG(selCluster);
      await (selGroup ? loadMembersByGroup(selGroup) : loadMembersByCluster(selCluster));
    }
    setRefreshing(false);
  }, [selCluster, selGroup]);

  const clearAll = () => {
    setSelState(null); setSelDistrict(null); setSelLocation(null);
    setSelCluster(null); setSelGroup(null); setSelPPG(null); setSelMember(null);
  };

  const selectedMemberData = members.find(m => m.unique_id === selMember);
  const hasFilter = selState || selDistrict || selLocation || selCluster;

  // Group members by group_cname for display
  const groupedMembers = members.reduce((acc, m) => {
    const key = m.group_cname || m.group_gcode || 'Unknown Group';
    if (!acc[key]) acc[key] = [];
    acc[key].push(m);
    return acc;
  }, {});

  return (
    <SafeAreaView style={s.safe} edges={['bottom']}>
      <ScrollView
        contentContainerStyle={s.scroll}
        keyboardShouldPersistTaps="handled"
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#1565C0']} />}
      >
        {/* Filter panel */}
        <View style={s.panel}>
          <Text style={s.panelTitle}>Filter FPO Records</Text>

          <Dropdown label="State"    value={selState}    options={states}    onSelect={setSelState}    loading={ldStates} />
          <Dropdown label="District" value={selDistrict} options={districts} onSelect={setSelDistrict} disabled={!selState}    loading={ldDistricts} />
          <Dropdown label="Location" value={selLocation} options={locations} onSelect={setSelLocation} disabled={!selDistrict} loading={ldLocations} />
          <Dropdown label="Cluster"  value={selCluster}  options={clusters}  onSelect={setSelCluster}  disabled={!selLocation} loading={ldClusters} />
          <Dropdown label="PPG Name" value={selPPG}      options={ppgList}   onSelect={setSelPPG}      disabled={!selCluster}  loading={ldPPG} />
          <Dropdown label="Group"    value={selGroup}    options={groups}    onSelect={setSelGroup}    disabled={!selCluster}  loading={ldGroups} />

          {/* Member dropdown */}
          <Dropdown
            label="Member"
            value={selMember}
            options={members.map(m => ({
              value: m.unique_id,
              label: `${m.unique_id}  (${m.group_cname || m.group_gcode})`,
            }))}
            onSelect={setSelMember}
            disabled={!selCluster}
            loading={ldMembers}
          />

          {hasFilter && (
            <TouchableOpacity style={s.clearBtn} onPress={clearAll}>
              <Text style={s.clearTxt}>✕  Clear all filters</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Selected member detail */}
        {selectedMemberData && (
          <View style={s.detailCard}>
            <Text style={s.detailTitle}>Selected Member</Text>
            {[
              ['Unique ID',    selectedMemberData.unique_id],
              ['Member Code',  selectedMemberData.member_mcode],
              ['Group',        selectedMemberData.group_cname || selectedMemberData.group_gcode],
            ].map(([label, val]) => (
              <View key={label} style={s.detailRow}>
                <Text style={s.detailLabel}>{label}</Text>
                <Text style={s.detailVal}>{val || '—'}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Members list grouped by group */}
        {selCluster && (
          <View>
            {ldMembers ? (
              <ActivityIndicator size="large" color="#1565C0" style={{ marginTop: 24 }} />
            ) : members.length > 0 ? (
              <>
                <Text style={s.count}>
                  {members.length} member{members.length !== 1 ? 's' : ''}
                  {selGroup ? ' in this group' : ' in this cluster'}
                </Text>
                {Object.entries(groupedMembers).map(([groupName, grpMembers]) => (
                  <View key={groupName} style={s.groupSection}>
                    <View style={s.groupHeader}>
                      <Text style={s.groupName}>{groupName}</Text>
                      <Text style={s.groupCount}>{grpMembers.length}</Text>
                    </View>
                    {grpMembers.map((m, i) => (
                      <MemberRow
                        key={m.unique_id}
                        member={m}
                        index={i}
                        selected={selMember === m.unique_id}
                        onPress={() => setSelMember(selMember === m.unique_id ? null : m.unique_id)}
                      />
                    ))}
                  </View>
                ))}
              </>
            ) : (
              <View style={s.empty}>
                <Text style={s.emptyIcon}>👥</Text>
                <Text style={s.emptyTitle}>No members found</Text>
                <Text style={s.emptySub}>No members registered in this cluster yet.</Text>
              </View>
            )}
          </View>
        )}

        {!selCluster && (
          <View style={s.empty}>
            <Text style={s.emptyIcon}>🏢</Text>
            <Text style={s.emptyTitle}>Select filters above</Text>
            <Text style={s.emptySub}>Choose up to Cluster level to view groups and members.</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

// ── Dropdown styles ──────────────────────────────────────────────────────────
const dd = StyleSheet.create({
  wrapper: { 
    marginBottom: 12, 
    zIndex: 10,
    position: 'relative',
  },
  label: { 
    fontSize: 13, 
    color: '#555', 
    fontWeight: '500', 
    marginBottom: 4 
  },
  btn: {
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between',
    borderWidth: 1, 
    borderColor: '#DDD', 
    borderRadius: 10,
    paddingHorizontal: 12, 
    paddingVertical: 10, 
    backgroundColor: '#FAFAFA',
    minHeight: 44,
  },
  disabled: { 
    opacity: 0.45 
  },
  txt: { 
    fontSize: 14, 
    color: '#222', 
    flex: 1,
    marginRight: 8,
  },
  ph: { 
    color: '#AAA' 
  },
  arrow: { 
    fontSize: 11, 
    color: '#888', 
    marginLeft: 8 
  },
  list: {
    position: 'absolute',
    top: 52,
    left: 0, 
    right: 0,
    backgroundColor: '#fff',
    borderWidth: 1, 
    borderColor: '#DDD',
    borderRadius: 10,
    zIndex: 999,
    elevation: 8,
    maxHeight: 220,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    overflow: 'hidden',
  },
  listScroll: {
    maxHeight: 220,
  },
  item: { 
    paddingHorizontal: 14, 
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  itemLast: {
    borderBottomWidth: 0,
  },
  itemSel: { 
    backgroundColor: '#E3F2FD' 
  },
  itemTxt: { 
    fontSize: 14, 
    color: '#333' 
  },
  itemTxtSel: { 
    color: '#1565C0', 
    fontWeight: '600' 
  },
  clear: { 
    fontSize: 13, 
    color: '#E53935',
    fontWeight: '500',
  },
  clearItem: {
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
});

// ── Screen styles ────────────────────────────────────────────────────────────
const BLUE = '#1565C0';
const s = StyleSheet.create({
  safe: { 
    flex: 1, 
    backgroundColor: '#F5F5F5' 
  },
  scroll: { 
    padding: 16, 
    paddingBottom: 40 
  },

  panel: {
    backgroundColor: '#fff', 
    borderRadius: 16, 
    padding: 16, 
    marginBottom: 16,
    elevation: 1, 
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 }, 
    shadowOpacity: 0.06, 
    shadowRadius: 4,
  },
  panelTitle: {
    fontSize: 13, 
    fontWeight: '600', 
    color: '#888',
    letterSpacing: 0.5, 
    textTransform: 'uppercase', 
    marginBottom: 14,
  },
  clearBtn: {
    marginTop: 6, 
    alignSelf: 'flex-start',
    paddingHorizontal: 12, 
    paddingVertical: 6,
    borderRadius: 20, 
    backgroundColor: '#FBE9E7',
  },
  clearTxt: { 
    fontSize: 13, 
    color: '#E53935', 
    fontWeight: '500' 
  },

  detailCard: {
    backgroundColor: '#E3F2FD', 
    borderRadius: 14, 
    padding: 16,
    marginBottom: 16, 
    borderWidth: 1, 
    borderColor: '#90CAF9',
  },
  detailTitle: {
    fontSize: 12, 
    fontWeight: '700', 
    color: BLUE,
    textTransform: 'uppercase', 
    letterSpacing: 0.5, 
    marginBottom: 10,
  },
  detailRow: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    paddingVertical: 4 
  },
  detailLabel: { 
    fontSize: 13, 
    color: '#555' 
  },
  detailVal: { 
    fontSize: 13, 
    fontWeight: '600', 
    color: '#1A1A1A' 
  },

  count: { 
    fontSize: 13, 
    color: '#888', 
    marginBottom: 10, 
    fontWeight: '500' 
  },

  groupSection: { 
    marginBottom: 12 
  },
  groupHeader: {
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center',
    backgroundColor: '#E3F2FD', 
    borderRadius: 8,
    paddingHorizontal: 12, 
    paddingVertical: 7, 
    marginBottom: 4,
  },
  groupName: { 
    fontSize: 13, 
    fontWeight: '600', 
    color: BLUE 
  },
  groupCount: {
    fontSize: 11, 
    fontWeight: '700', 
    color: BLUE,
    backgroundColor: '#fff', 
    paddingHorizontal: 8, 
    paddingVertical: 2,
    borderRadius: 10,
  },

  memberRow: {
    backgroundColor: '#fff', 
    borderRadius: 10, 
    padding: 12,
    marginBottom: 6, 
    flexDirection: 'row', 
    alignItems: 'center',
    elevation: 1, 
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 }, 
    shadowOpacity: 0.04, 
    shadowRadius: 3,
  },
  memberRowSel: { 
    backgroundColor: '#E3F2FD', 
    borderWidth: 1, 
    borderColor: '#90CAF9' 
  },
  avatar: {
    width: 38, 
    height: 38, 
    borderRadius: 19,
    backgroundColor: '#E3F2FD', 
    alignItems: 'center', 
    justifyContent: 'center', 
    marginRight: 10,
  },
  avatarSel: { 
    backgroundColor: BLUE 
  },
  avatarTxt: { 
    fontSize: 12, 
    fontWeight: '700', 
    color: BLUE 
  },
  avatarTxtSel: { 
    color: '#fff' 
  },
  memberMid: { 
    flex: 1 
  },
  memberCode: { 
    fontSize: 13, 
    fontWeight: '600', 
    color: '#1A1A1A' 
  },
  memberGroup: { 
    fontSize: 11, 
    color: '#888', 
    marginTop: 2 
  },
  memberMcode: { 
    fontSize: 11, 
    color: '#888' 
  },

  empty: { 
    alignItems: 'center', 
    paddingVertical: 48, 
    paddingHorizontal: 24 
  },
  emptyIcon: { 
    fontSize: 40, 
    marginBottom: 12 
  },
  emptyTitle: { 
    fontSize: 16, 
    fontWeight: '600', 
    color: '#333', 
    marginBottom: 6 
  },
  emptySub: { 
    fontSize: 13, 
    color: '#888', 
    textAlign: 'center', 
    lineHeight: 20 
  },
});