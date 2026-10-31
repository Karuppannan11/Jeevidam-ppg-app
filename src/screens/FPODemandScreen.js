// src/screens/FPODemandScreen.js
import React, { useState, useEffect } from 'react';
import { Alert, View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import {
  ScreenShell, Card, SectionHeader, FormInput,
  Dropdown, SubmitButton, theme, useLocationCascade,
} from '../components/SharedComponents';
import * as api from '../api/api';
import DateTimePicker from '@react-native-community/datetimepicker';

export default function FPODemandScreen({ navigation }) {
  const loc = useLocationCascade();
  
  const [fpoList, setFpoList] = useState([]);
  const [fpoId, setFpoId] = useState('');
  const [fpoLoading, setFpoLoading] = useState(false);
  
  const [demands, setDemands] = useState([]);
  const [productName, setProductName] = useState('');
  const [quantity, setQuantity] = useState('');
  const [unitPrice, setUnitPrice] = useState('');
  const [demandDate, setDemandDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [notes, setNotes] = useState('');
  
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  // Fetch FPO list
  useEffect(() => {
    if (!loc.vals.cluster_ccode) {
      setFpoList([]);
      return;
    }
    
    setFpoLoading(true);
    api.fetchFPOList(loc.vals.cluster_ccode)
      .then(data => {
        const fpoData = Array.isArray(data) ? data : (data?.data || []);
        const formattedList = fpoData.map(d => ({
          label: d.fpo_name,
          value: String(d.id),
          details: d,
        }));
        setFpoList(formattedList);
      })
      .catch(err => {
        console.error('Failed to fetch FPO list:', err);
        Alert.alert('Error', 'Failed to fetch FPO list');
      })
      .finally(() => setFpoLoading(false));
  }, [loc.vals.cluster_ccode]);

  const handleFpoSelect = (id) => {
    setFpoId(id);
    setErrors(e => ({ ...e, fpo: '' }));
  };

  const addDemand = () => {
    if (!productName.trim()) {
      Alert.alert('Error', 'Please enter product name');
      return;
    }
    if (!quantity || parseFloat(quantity) <= 0) {
      Alert.alert('Error', 'Please enter valid quantity');
      return;
    }
    if (!unitPrice || parseFloat(unitPrice) <= 0) {
      Alert.alert('Error', 'Please enter valid unit price');
      return;
    }

    const newDemand = {
      product_name: productName.trim(),
      quantity: parseFloat(quantity),
      unit_price: parseFloat(unitPrice),
      total_supply: parseFloat(quantity) * parseFloat(unitPrice),
    };

    setDemands([...demands, newDemand]);
    setProductName('');
    setQuantity('');
    setUnitPrice('');
  };

  const removeDemand = (index) => {
    setDemands(demands.filter((_, i) => i !== index));
  };

  const validate = () => {
    const e = {};
    if (!fpoId) e.fpo = 'Select an FPO';
    if (demands.length === 0) e.demands = 'Add at least one demand product';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) {
      Alert.alert('Fix errors', 'Please correct the highlighted fields.');
      return;
    }

    setSaving(true);
    try {
      // Submit each demand
      for (const demand of demands) {
        await api.createFPODemand({
          fpo_id: parseInt(fpoId),
          product_name: demand.product_name,
          quantity: demand.quantity,
          unit_price: demand.unit_price,
          demand_date: demandDate.toISOString().split('T')[0],
          notes: notes || null,
        });
      }

      Alert.alert(
        '✅ Success',
        `${demands.length} demand(s) recorded successfully!`,
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    } catch (err) {
      console.error('Error saving demands:', err);
      Alert.alert('Error', err.message || 'Failed to save demands');
    } finally {
      setSaving(false);
    }
  };

  return (
    <ScreenShell>
      <ScrollView>
        <Card>
          <SectionHeader title="Select FPO" icon="🏢" />
          
          <Dropdown
            label="FPO"
            required
            value={fpoId}
            items={fpoList}
            loading={fpoLoading}
            onSelect={handleFpoSelect}
            error={errors.fpo}
            placeholder="Select an FPO"
          />
        </Card>

        {fpoId && (
          <>
            <Card>
              <SectionHeader title="Demand Details" icon="📦" />
              
              <TouchableOpacity 
                style={s.dateInput}
                onPress={() => setShowDatePicker(true)}
              >
                <Text style={s.dateLabel}>Demand Date</Text>
                <Text style={s.dateValue}>
                  {demandDate.toLocaleDateString()}
                </Text>
              </TouchableOpacity>
              
              {showDatePicker && (
                <DateTimePicker
                  value={demandDate}
                  mode="date"
                  display="default"
                  onChange={(event, selectedDate) => {
                    setShowDatePicker(false);
                    if (selectedDate) setDemandDate(selectedDate);
                  }}
                />
              )}

              <View style={s.demandRow}>
                <View style={s.demandField}>
                  <FormInput
                    label="Product Name"
                    value={productName}
                    onChangeText={setProductName}
                    placeholder="Enter product name"
                  />
                </View>
                <View style={s.demandField}>
                  <FormInput
                    label="Quantity"
                    value={quantity}
                    onChangeText={setQuantity}
                    placeholder="Qty"
                    keyboardType="numeric"
                  />
                </View>
                <View style={s.demandField}>
                  <FormInput
                    label="Unit Price (₹)"
                    value={unitPrice}
                    onChangeText={setUnitPrice}
                    placeholder="Price"
                    keyboardType="numeric"
                  />
                </View>
                <TouchableOpacity style={s.addDemandBtn} onPress={addDemand}>
                  <Text style={s.addDemandBtnText}>+</Text>
                </TouchableOpacity>
              </View>

              {demands.length > 0 && (
                <View style={s.demandList}>
                  <Text style={s.demandListTitle}>Added Demands:</Text>
                  {demands.map((d, index) => (
                    <View key={index} style={s.demandItem}>
                      <View style={s.demandItemContent}>
                        <Text style={s.demandItemProduct}>{d.product_name}</Text>
                        <Text style={s.demandItemDetails}>
                          Qty: {d.quantity} × ₹{d.unit_price} = ₹{d.total_supply}
                        </Text>
                      </View>
                      <TouchableOpacity 
                        onPress={() => removeDemand(index)}
                        style={s.removeDemandBtn}
                      >
                        <Text style={s.removeDemandBtnText}>✕</Text>
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              )}
              {errors.demands && <Text style={s.errorText}>{errors.demands}</Text>}

              <FormInput
                label="Notes"
                value={notes}
                onChangeText={setNotes}
                placeholder="Additional notes (optional)"
                multiline
                numberOfLines={3}
              />
            </Card>

            <SubmitButton 
              title="Save Demands" 
              onPress={handleSubmit} 
              loading={saving} 
            />
          </>
        )}
      </ScrollView>
    </ScreenShell>
  );
}

const s = StyleSheet.create({
  dateInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    marginBottom: 10,
    backgroundColor: '#fff',
  },
  dateLabel: {
    fontSize: 12,
    color: theme.muted,
    marginBottom: 4,
  },
  dateValue: {
    fontSize: 16,
    color: '#333',
  },
  errorText: {
    color: theme.error,
    fontSize: 12,
    marginTop: 4,
  },
  demandRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
  },
  demandField: {
    flex: 1,
  },
  addDemandBtn: {
    backgroundColor: theme.green,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  addDemandBtnText: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
  },
  demandList: {
    marginTop: 12,
  },
  demandListTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  demandItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#f9f9f9',
    padding: 10,
    borderRadius: 8,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: '#eee',
  },
  demandItemContent: {
    flex: 1,
  },
  demandItemProduct: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
  },
  demandItemDetails: {
    fontSize: 12,
    color: theme.muted,
    marginTop: 2,
  },
  removeDemandBtn: {
    padding: 6,
  },
  removeDemandBtnText: {
    fontSize: 16,
    color: theme.error,
    fontWeight: 'bold',
  },
});