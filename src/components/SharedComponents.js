// src/components/SharedComponents.js
import React, { useState, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, Modal, FlatList,
  TextInput, StyleSheet, ActivityIndicator, ScrollView,
} from 'react-native';
import * as api from '../api/api';

export const theme = {
  green:      '#2E7D32',
  greenLight: '#43A047',
  greenPale:  '#E8F5E9',
  greenBorder:'#A5D6A7',
  amber:      '#F9A825',
  text:       '#1A1A1A',
  muted:      '#6B7280',
  error:      '#D32F2F',
  white:      '#FFFFFF',
  bg:         '#F7FAF7',
  border:     '#DDE8DD',
  radius:     10,
};

// ── FormInput ─────────────────────────────────────────────────
export function FormInput({ label, value, onChangeText, placeholder, maxLength,
  keyboardType = 'default', multiline = false, error, required, editable = true }) {
  const chars = value ? value.length : 0;
  return (
    <View style={fi.wrap}>
      <View style={fi.labelRow}>
        <Text style={fi.label}>{label}{required && <Text style={{ color: theme.error }}> *</Text>}</Text>
        {maxLength && <Text style={[fi.counter, chars > maxLength * 0.9 && fi.counterWarn]}>{chars}/{maxLength}</Text>}
      </View>
      <TextInput
        style={[fi.input, multiline && fi.multiline, error && fi.inputError, !editable && fi.disabled]}
        value={value} onChangeText={onChangeText}
        placeholder={placeholder || `Enter ${label.toLowerCase()}`}
        placeholderTextColor={theme.muted} maxLength={maxLength}
        keyboardType={keyboardType} multiline={multiline}
        numberOfLines={multiline ? 3 : 1} editable={editable}
      />
      {error && <Text style={fi.errorText}>{error}</Text>}
    </View>
  );
}
const fi = StyleSheet.create({
  wrap: { marginBottom: 14 },
  labelRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 5 },
  label: { fontSize: 13, fontWeight: '600', color: theme.text },
  counter: { fontSize: 11, color: theme.muted },
  counterWarn: { color: theme.amber },
  input: { borderWidth: 1.5, borderColor: theme.border, borderRadius: theme.radius,
    paddingHorizontal: 13, paddingVertical: 10, fontSize: 14, color: theme.text, backgroundColor: theme.white },
  inputError: { borderColor: theme.error },
  disabled: { backgroundColor: '#F3F4F6', color: theme.muted },
  multiline: { height: 80, textAlignVertical: 'top' },
  errorText: { fontSize: 11, color: theme.error, marginTop: 3 },
});

// ── Dropdown ──────────────────────────────────────────────────
export function Dropdown({ label, value, items = [], onSelect, loading, disabled, required, error, placeholder }) {
  const [open, setOpen] = useState(false);
  const selected = items.find(i => i.value === value);
  return (
    <View style={dd.wrap}>
      <View style={fi.labelRow}>
        <Text style={fi.label}>{label}{required && <Text style={{ color: theme.error }}> *</Text>}</Text>
      </View>
      <TouchableOpacity
        style={[dd.trigger, disabled && dd.disabled, error && dd.error]}
        onPress={() => !disabled && !loading && setOpen(true)} activeOpacity={0.7}>
        {loading
          ? <ActivityIndicator size="small" color={theme.green} />
          : <Text style={[dd.triggerText, !selected && dd.placeholder]}>
              {selected ? selected.label : (placeholder || `Select ${label}`)}
            </Text>}
        <Text style={dd.arrow}>{open ? '▲' : '▼'}</Text>
      </TouchableOpacity>
      {error && <Text style={fi.errorText}>{error}</Text>}
      <Modal visible={open} transparent animationType="fade">
        <TouchableOpacity style={dd.overlay} onPress={() => setOpen(false)} activeOpacity={1}>
          <View style={dd.sheet}>
            <View style={dd.header}>
              <Text style={dd.title}>Select {label}</Text>
              <TouchableOpacity onPress={() => setOpen(false)}>
                <Text style={dd.close}>✕</Text>
              </TouchableOpacity>
            </View>
            <FlatList
              data={items} keyExtractor={i => String(i.value)}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[dd.item, item.value === value && dd.itemActive]}
                  onPress={() => { onSelect(item.value); setOpen(false); }}>
                  <Text style={[dd.itemText, item.value === value && dd.itemTextActive]}>{item.label}</Text>
                  {item.value === value && <Text style={{ color: theme.green, fontWeight: '700' }}>✓</Text>}
                </TouchableOpacity>
              )}
              ListEmptyComponent={<Text style={dd.empty}>No options available</Text>}
            />
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}
const dd = StyleSheet.create({
  wrap: { marginBottom: 14 },
  trigger: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    borderWidth: 1.5, borderColor: theme.border, borderRadius: theme.radius,
    paddingHorizontal: 13, paddingVertical: 11, backgroundColor: theme.white },
  disabled: { backgroundColor: '#F3F4F6' },
  error: { borderColor: theme.error },
  triggerText: { fontSize: 14, color: theme.text, flex: 1 },
  placeholder: { color: theme.muted },
  arrow: { fontSize: 10, color: theme.muted },
  overlay: {
  flex: 1,
  backgroundColor: 'rgba(0,0,0,0.45)',
  justifyContent: 'center',
  alignItems: 'center',
},

sheet: {
  width: '92%',
  maxHeight: '75%',
  backgroundColor: theme.white,
  borderRadius: 18,
  overflow: 'hidden',
},
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 18, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: theme.border },
  title: { fontSize: 15, fontWeight: '700', color: theme.text },
  close: { fontSize: 16, color: theme.muted, padding: 4 },
  item: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 18, paddingVertical: 13, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  itemActive: { backgroundColor: theme.greenPale },
  itemText: { fontSize: 14, color: theme.text },
  itemTextActive: { color: theme.green, fontWeight: '600' },
  empty: { textAlign: 'center', color: theme.muted, padding: 24 },
});

// ── MultiSelect ───────────────────────────────────────────────
export function MultiSelect({ label, items = [], selected, onToggle, loading, disabled, required, error }) {
  const [open, setOpen] = useState(false);
  const count = selected.length;
  return (
    <View style={ms.wrap}>
      <View style={fi.labelRow}>
        <Text style={fi.label}>{label}{required && <Text style={{ color: theme.error }}> *</Text>}</Text>
        {count > 0 && <View style={ms.badge}><Text style={ms.badgeText}>{count} selected</Text></View>}
      </View>
      <TouchableOpacity
        style={[dd.trigger, disabled && dd.disabled]}
        onPress={() => !disabled && !loading && setOpen(true)} activeOpacity={0.7}>
        {loading
          ? <ActivityIndicator size="small" color={theme.green} />
          : <Text style={[dd.triggerText, count === 0 && dd.placeholder]}>
              {count === 0 ? `Select ${label}` : count === 1
                ? (items.find(i => i.value === selected[0])?.label || '1 selected')
                : `${count} items selected`}
            </Text>}
        <Text style={dd.arrow}>▼</Text>
      </TouchableOpacity>
      {error && <Text style={fi.errorText}>{error}</Text>}
      {count > 0 && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 8 }}>
          {selected.map(id => {
            const item = items.find(i => i.value === id);
            return item ? (
              <TouchableOpacity key={id} style={ms.chip} onPress={() => onToggle(id)}>
                <Text style={ms.chipText}>{item.label}</Text>
                <Text style={ms.chipX}>✕</Text>
              </TouchableOpacity>
            ) : null;
          })}
        </ScrollView>
      )}
      <Modal visible={open} transparent animationType="fade">
        <TouchableOpacity style={dd.overlay} onPress={() => setOpen(false)} activeOpacity={1}>
          <View style={dd.sheet}>
            <View style={dd.header}>
              <Text style={dd.title}>Select {label}</Text>
              <TouchableOpacity onPress={() => setOpen(false)}>
                <Text style={[dd.close, { color: theme.green, fontWeight: '700' }]}>Done</Text>
              </TouchableOpacity>
            </View>
            <FlatList
              data={items} keyExtractor={i => String(i.value)}
              renderItem={({ item }) => {
                const checked = selected.includes(item.value);
                return (
                  <TouchableOpacity
                    style={[dd.item, checked && dd.itemActive]}
                    onPress={() => onToggle(item.value)}>
                    <View style={[ms.checkbox, checked && ms.checkboxOn]}>
                      {checked && <Text style={ms.checkmark}>✓</Text>}
                    </View>
                    <Text style={[dd.itemText, { flex: 1, marginLeft: 12 }]}>{item.label}</Text>
                  </TouchableOpacity>
                );
              }}
              ListEmptyComponent={<Text style={dd.empty}>No items available</Text>}
            />
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}
const ms = StyleSheet.create({
  wrap: { marginBottom: 14 },
  badge: { backgroundColor: theme.green, borderRadius: 10, paddingHorizontal: 7, paddingVertical: 2 },
  badgeText: { fontSize: 11, color: theme.white, fontWeight: '700' },
  chip: { flexDirection: 'row', alignItems: 'center', backgroundColor: theme.greenPale,
    borderRadius: 20, paddingHorizontal: 10, paddingVertical: 5, marginRight: 7,
    borderWidth: 1, borderColor: theme.greenBorder },
  chipText: { fontSize: 12, color: theme.green, fontWeight: '500', marginRight: 4 },
  chipX: { fontSize: 10, color: theme.green },
  checkbox: { width: 20, height: 20, borderRadius: 4, borderWidth: 2, borderColor: theme.border,
    alignItems: 'center', justifyContent: 'center' },
  checkboxOn: { backgroundColor: theme.green, borderColor: theme.green },
  checkmark: { color: theme.white, fontSize: 12, fontWeight: '700' },
});

// ── SectionHeader ─────────────────────────────────────────────
export function SectionHeader({ title, icon }) {
  return (
    <View style={sh.wrap}>
      <View style={sh.line} />
      <Text style={sh.text}>{icon ? `${icon}  ${title}` : title}</Text>
      <View style={sh.line} />
    </View>
  );
}
const sh = StyleSheet.create({
  wrap: { flexDirection: 'row', alignItems: 'center', marginBottom: 14, marginTop: 4 },
  line: { flex: 1, height: 1, backgroundColor: theme.border },
  text: { fontSize: 11, fontWeight: '700', color: theme.green, letterSpacing: 1.1,
    textTransform: 'uppercase', marginHorizontal: 10 },
});

// ── SubmitButton ──────────────────────────────────────────────
export function SubmitButton({ title, onPress, loading }) {
  return (
    <TouchableOpacity style={sb.btn} onPress={onPress} disabled={loading} activeOpacity={0.85}>
      {loading ? <ActivityIndicator color={theme.white} />
        : <Text style={sb.text}>{title}</Text>}
    </TouchableOpacity>
  );
}
const sb = StyleSheet.create({
  btn: { backgroundColor: theme.green, borderRadius: theme.radius,
    paddingVertical: 15, alignItems: 'center', marginTop: 8, marginBottom: 24,
    shadowColor: theme.green, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35, shadowRadius: 8, elevation: 5 },
  text: { color: theme.white, fontSize: 15, fontWeight: '700', letterSpacing: 0.5 },
});

// ── Card ──────────────────────────────────────────────────────
export function Card({ children, style }) {
  return <View style={[c.card, style]}>{children}</View>;
}
const c = StyleSheet.create({
  card: { backgroundColor: theme.white, borderRadius: 14, padding: 16, marginBottom: 14,
    borderWidth: 1, borderColor: theme.border,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06, shadowRadius: 4, elevation: 2 },
});

// ── ScreenShell ───────────────────────────────────────────────
export function ScreenShell({ children }) {
  return (
    <ScrollView style={{ flex: 1, backgroundColor: theme.bg }}
      contentContainerStyle={{ padding: 16, paddingBottom: 60 }}
      keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
      {children}
    </ScrollView>
  );
}
// src/components/SharedComponents.js
// Update the useLocationCascade hook at the bottom:

export function useLocationCascade() {
  const [lists, setLists] = useState({ 
    states: [], 
    districts: [], 
    locations: [], 
    clusters: [], 
    groups: [] 
  });
  const [vals, setVals] = useState({ 
    state_scode: '', 
    district_dcode: '', 
    location_lcode: '', 
    cluster_ccode: '', 
    group_gcode: '' 
  });
  const [loading, setLoading] = useState({});

  const setLoad = (key, val) => setLoading(l => ({ ...l, [key]: val }));

  // Load states on mount
  useEffect(() => {
    setLoad('states', true);
    api.fetchStates()
      .then(data => {
        // Handle both {data: [...]} and direct array
        const statesData = Array.isArray(data) ? data : (data?.data || []);
        setLists(l => ({ 
          ...l, 
          states: statesData.map(d => ({ 
            label: d.state_sname, 
            value: d.state_scode 
          })) 
        }));
      })
      .catch(err => console.error('Failed to fetch states:', err))
      .finally(() => setLoad('states', false));
  }, []);

  const onState = (scode) => {
    setVals({ 
      state_scode: scode, 
      district_dcode: '', 
      location_lcode: '', 
      cluster_ccode: '', 
      group_gcode: '' 
    });
    setLists(l => ({ ...l, districts: [], locations: [], clusters: [], groups: [] }));
    if (!scode) return;
    
    setLoad('districts', true);
    api.fetchDistricts(scode)
      .then(data => {
        const districtsData = Array.isArray(data) ? data : (data?.data || []);
        setLists(l => ({ 
          ...l, 
          districts: districtsData.map(d => ({ 
            label: d.district_dname, 
            value: d.district_dcode 
          })) 
        }));
      })
      .catch(err => console.error('Failed to fetch districts:', err))
      .finally(() => setLoad('districts', false));
  };

  const onDistrict = (dcode) => {
    setVals(v => ({ 
      ...v, 
      district_dcode: dcode, 
      location_lcode: '', 
      cluster_ccode: '', 
      group_gcode: '' 
    }));
    setLists(l => ({ ...l, locations: [], clusters: [], groups: [] }));
    if (!dcode) return;
    
    setLoad('locations', true);
    api.fetchLocations(dcode)
      .then(data => {
        const locationsData = Array.isArray(data) ? data : (data?.data || []);
        setLists(l => ({ 
          ...l, 
          locations: locationsData.map(d => ({ 
            label: d.location_lname, 
            value: d.location_lcode 
          })) 
        }));
      })
      .catch(err => console.error('Failed to fetch locations:', err))
      .finally(() => setLoad('locations', false));
  };

  const onLocation = (lcode) => {
    setVals(v => ({ 
      ...v, 
      location_lcode: lcode, 
      cluster_ccode: '', 
      group_gcode: '' 
    }));
    setLists(l => ({ ...l, clusters: [], groups: [] }));
    if (!lcode) return;
    
    setLoad('clusters', true);
    api.fetchClusters(lcode)
      .then(data => {
        const clustersData = Array.isArray(data) ? data : (data?.data || []);
        setLists(l => ({ 
          ...l, 
          clusters: clustersData.map(d => ({ 
            label: d.cluster_cname, 
            value: d.cluster_ccode 
          })) 
        }));
      })
      .catch(err => console.error('Failed to fetch clusters:', err))
      .finally(() => setLoad('clusters', false));
  };
// src/components/SharedComponents.js
// Update the onCluster function in useLocationCascade:

const onCluster = (ccode) => {
  console.log('Cluster selected:', ccode);
  setVals(v => ({ ...v, cluster_ccode: ccode, group_gcode: '' }));
  setLists(l => ({ ...l, groups: [] }));
  if (!ccode) return;
  
  setLoad('groups', true);
  api.fetchGroups(ccode)
    .then(data => {
      console.log('Groups loaded:', data);
      const groupsData = Array.isArray(data) ? data : (data?.data || []);
      setLists(l => ({ 
        ...l, 
        groups: groupsData.map(d => ({ 
          label: d.group_cname, 
          value: d.group_gcode 
        })) 
      }));
    })
    .catch(err => {
      console.error('Failed to fetch groups:', err);
    })
    .finally(() => setLoad('groups', false));
};
  const onGroup = (gcode) => setVals(v => ({ ...v, group_gcode: gcode }));

  return { 
    lists, 
    vals, 
    loading, 
    onState, 
    onDistrict, 
    onLocation, 
    onCluster, 
    onGroup,
    // Aliases for compatibility with different naming
    onStateChange: onState,
    onDistrictChange: onDistrict,
    onLocationChange: onLocation,
    onClusterChange: onCluster,
    onGroupChange: onGroup,
  };
}