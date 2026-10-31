// src/screens/ProductManagementScreen.js - Complete updated version

import React, { useState, useEffect, useCallback } from 'react';
import { Alert, View, Text, StyleSheet, ScrollView, TouchableOpacity, FlatList } from 'react-native';
import {
  ScreenShell, Card, SectionHeader, FormInput,
  Dropdown, SubmitButton, theme,
} from '../components/SharedComponents';
import * as api from '../api/api';

export default function ProductManagementScreen() {
  // PPG Selection
  const [ppgs, setPpgs] = useState([]);
  const [selectedPpgId, setSelectedPpgId] = useState('');
  const [selectedPpgName, setSelectedPpgName] = useState('');
  const [ppgsLoading, setPpgsLoading] = useState(false);

  // Units
  const [units, setUnits] = useState([]);
  const [unitName, setUnitName] = useState('');
  const [unitsLoading, setUnitsLoading] = useState(false);
  const [savingUnit, setSavingUnit] = useState(false);

  // Products
  const [products, setProducts] = useState([]);
  const [productName, setProductName] = useState('');
  const [selectedUnitId, setSelectedUnitId] = useState('');
  const [productsLoading, setProductsLoading] = useState(false);
  const [savingProduct, setSavingProduct] = useState(false);

  const [errors, setErrors] = useState({});

  // Load all PPGs
  const loadPPGs = useCallback(async () => {
    setPpgsLoading(true);
    try {
      const data = await api.fetchAllPPGsForProducts();
      setPpgs(data || []);
    } catch (err) {
      Alert.alert('Error', 'Failed to load PPGs: ' + err.message);
      setPpgs([]);
    } finally {
      setPpgsLoading(false);
    }
  }, []);

  // Load units
  const loadUnits = useCallback(async () => {
    setUnitsLoading(true);
    try {
      const data = await api.fetchUnits();
      setUnits(data || []);
    } catch (err) {
      Alert.alert('Error', 'Failed to load units: ' + err.message);
      setUnits([]);
    } finally {
      setUnitsLoading(false);
    }
  }, []);

  // Load products for selected PPG
  const loadProducts = useCallback(async () => {
    if (!selectedPpgId) {
      setProducts([]);
      return;
    }
    
    setProductsLoading(true);
    try {
      const data = await api.fetchPPGProducts(selectedPpgId);
      setProducts(data || []);
    } catch (err) {
      Alert.alert('Error', 'Failed to load products: ' + err.message);
      setProducts([]);
    } finally {
      setProductsLoading(false);
    }
  }, [selectedPpgId]);

  useEffect(() => {
    loadPPGs();
    loadUnits();
  }, [loadPPGs, loadUnits]);

  useEffect(() => {
    if (selectedPpgId) {
      loadProducts();
    } else {
      setProducts([]);
    }
  }, [selectedPpgId, loadProducts]);

  const handlePpgSelect = (ppgId) => {
    const selected = ppgs.find(p => String(p.id) === String(ppgId));
    setSelectedPpgId(ppgId);
    setSelectedPpgName(selected?.ppg_name || '');
    setErrors(e => ({ ...e, ppg: '' }));
    // Reset product form
    setProductName('');
    setSelectedUnitId('');
  };

  const handleAddUnit = async () => {
    if (!unitName.trim()) {
      setErrors(e => ({ ...e, unitName: 'Enter a unit name' }));
      return;
    }
    setSavingUnit(true);
    try {
      await api.createUnit(unitName.trim());
      setUnitName('');
      setErrors(e => ({ ...e, unitName: '' }));
      await loadUnits();
      Alert.alert('✅ Saved', 'Unit added successfully');
    } catch (err) {
      Alert.alert('Error', err.message || 'Failed to add unit');
    } finally {
      setSavingUnit(false);
    }
  };

  // 🔥 Check if EXACT duplicate exists (same product name AND same unit)
  const checkDuplicateProduct = () => {
    if (!selectedPpgId || !productName.trim() || !selectedUnitId) return null;
    
    const duplicate = products.find(p => 
      p.product_name.toLowerCase() === productName.trim().toLowerCase() &&
      String(p.unit_id) === String(selectedUnitId)
    );
    
    return duplicate;
  };

  // 🔥 Check if same product exists with different unit
  const checkProductWithDifferentUnit = () => {
    if (!selectedPpgId || !productName.trim() || !selectedUnitId) return null;
    
    const existing = products.find(p => 
      p.product_name.toLowerCase() === productName.trim().toLowerCase() &&
      String(p.unit_id) !== String(selectedUnitId)
    );
    
    return existing;
  };

 const handleAddProduct = async () => {
  const e = {};
  if (!selectedPpgId) e.ppg = 'Select a PPG first';
  if (!productName.trim()) e.productName = 'Enter a product name';
  if (!selectedUnitId) e.unit = 'Select a unit';
  setErrors(prev => ({ ...prev, ...e }));
  if (Object.keys(e).length > 0) return;

  // 🔥 Check 1: EXACT duplicate (same product + same unit)
  const exactDuplicate = checkDuplicateProduct();
  if (exactDuplicate) {
    const unitName = units.find(u => String(u.id) === String(exactDuplicate.unit_id))?.unit_name || '';
    Alert.alert(
      '⚠️ Product Already Exists',
      `"${exactDuplicate.product_name}" with unit "${unitName}" already exists for this PPG.\n\nPlease use a different unit or product name.`,
      [{ text: 'OK' }]
    );
    return;
  }

  // 🔥 Check 2: Same product with different unit - Ask user
  const differentUnit = checkProductWithDifferentUnit();
  if (differentUnit) {
    const existingUnitName = units.find(u => String(u.id) === String(differentUnit.unit_id))?.unit_name || '';
    const newUnitName = units.find(u => String(u.id) === String(selectedUnitId))?.unit_name || '';
    
    // Show confirmation dialog
    Alert.alert(
      '📦 Same Product, Different Unit',
      `"${productName.trim()}" already exists with unit "${existingUnitName}"`,
      [
        { text: 'Cancel', style: 'cancel' },
        // { 
        //   text: 'Yes, Add', 
        //   onPress: async () => {
        //     setSavingProduct(true);
        //     try {
        //       console.log('📦 Adding product:', {
        //         ppg_id: parseInt(selectedPpgId),
        //         product_name: productName.trim(),
        //         unit_id: parseInt(selectedUnitId)
        //       });
              
        //       const response = await api.createPPGProduct(
        //         parseInt(selectedPpgId), 
        //         productName.trim(), 
        //         parseInt(selectedUnitId)
        //       );
              
        //       console.log('✅ Product added:', response);
        //       setProductName('');
        //       setSelectedUnitId('');
        //       await loadProducts();
        //       Alert.alert('✅ Saved', `"${productName.trim()}" added with unit "${newUnitName}"`);
        //     } catch (err) {
        //       console.error('❌ Error adding product:', err);
        //       // 🔥 Check if it's a duplicate error from server
        //       if (err.response?.status === 409) {
        //         Alert.alert(
        //           '⚠️ Product Already Exists',
        //           `"${productName.trim()}" with unit "${newUnitName}" already exists.`,
        //           [{ text: 'OK' }]
        //         );
        //       } else {
        //         Alert.alert('Error', err.response?.data?.error || err.message || 'Failed to add product');
        //       }
        //     } finally {
        //       setSavingProduct(false);
        //     }
        //   }
        // }
      ]
    );
    return;
  }

  // No duplicates found - add normally
  setSavingProduct(true);
  try {
    console.log('📦 Adding new product:', {
      ppg_id: parseInt(selectedPpgId),
      product_name: productName.trim(),
      unit_id: parseInt(selectedUnitId)
    });
    
    await api.createPPGProduct(
      parseInt(selectedPpgId), 
      productName.trim(), 
      parseInt(selectedUnitId)
    );
    setProductName('');
    setSelectedUnitId('');
    await loadProducts();
    Alert.alert('✅ Saved', 'Product added successfully');
  } catch (err) {
    console.error('❌ Error adding product:', err);
    if (err.response?.status === 409) {
      const unitName = units.find(u => String(u.id) === String(selectedUnitId))?.unit_name || '';
      Alert.alert(
        '⚠️ Product Already Exists',
        `"${productName.trim()}" with unit "${unitName}" already exists for this PPG.`,
        [{ text: 'OK' }]
      );
      setProductName('');
      setSelectedUnitId('');
    } else {
      Alert.alert('Error', err.response?.data?.error || err.message || 'Failed to add product');
    }
  } finally {
    setSavingProduct(false);
  }
};
  const handleDeleteProduct = (id, name) => {
    Alert.alert('Delete product', `Remove "${name}" from this PPG?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await api.deleteProduct(id);
            await loadProducts();
          } catch (err) {
            Alert.alert('Error', err.message || 'Failed to delete product');
          }
        },
      },
    ]);
  };

  const ppgItems = ppgs.map(p => ({ 
    label: `${p.ppg_name} (${p.ppg_code || 'N/A'})`, 
    value: String(p.id) 
  }));

  const unitItems = units.map(u => ({ label: u.unit_name, value: String(u.id) }));

const renderProductItem = ({ item }) => (
  <View style={s.productRow}>
    <View style={s.productInfo}>
      <Text style={s.productName}>{item.product_name}</Text>
      <Text style={s.productUnit}>Unit: {item.unit_name || 'N/A'}</Text>
      <Text style={s.productPpgId}>PPG: {item.ppg_name || 'N/A'} (ID: {item.ppg_id})</Text>
    </View>
    <TouchableOpacity onPress={() => handleDeleteProduct(item.id, item.product_name)}>
      <Text style={s.deleteText}>Delete</Text>
    </TouchableOpacity>
  </View>
);
  return (
    <ScreenShell>
      <ScrollView>
        {/* PPG Selection */}
        <Card>
          <SectionHeader title="Select PPG" icon="🌿" />
          <Dropdown
            label="PPG"
            required
            value={selectedPpgId}
            items={ppgItems}
            loading={ppgsLoading}
            onSelect={(val) => {
              handlePpgSelect(val);
            }}
            error={errors.ppg}
            placeholder="Select a PPG"
          />
          {selectedPpgName && (
            <View style={s.selectedPpgInfo}>
              <Text style={s.selectedPpgText}>✓ Working with: {selectedPpgName}</Text>
            </View>
          )}
        </Card>

        {/* Units Section */}
        <Card>
          <SectionHeader title="Add Unit" icon="📏" />
          <FormInput
            label="Unit Name"
            required
            value={unitName}
            onChangeText={setUnitName}
            placeholder="e.g. kg, litre, bag"
            error={errors.unitName}
          />
          <SubmitButton title="Add Unit" onPress={handleAddUnit} loading={savingUnit} />

          {units.length > 0 && (
            <View style={s.listWrap}>
              <Text style={s.listHeader}>Existing Units ({units.length})</Text>
              <View style={s.chipRow}>
                {units.map(u => (
                  <View key={u.id} style={s.chip}>
                    <Text style={s.chipText}>{u.unit_name}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}
        </Card>

        {/* Products Section - Only show if PPG selected */}
        {selectedPpgId && (
          <Card>
            <SectionHeader title={`Add Product for ${selectedPpgName}`} icon="📦" />
            <FormInput
              label="Product Name"
              required
              value={productName}
              onChangeText={setProductName}
              placeholder="e.g. Urea, Seeds, Fertilizer"
              error={errors.productName}
            />
            <Dropdown
              label="Unit"
              required
              value={selectedUnitId}
              items={unitItems}
              loading={unitsLoading}
              onSelect={(val) => {
                setSelectedUnitId(val);
                setErrors(e => ({ ...e, unit: '' }));
              }}
              error={errors.unit}
              placeholder="Select a unit"
            />
            <SubmitButton title="Add Product" onPress={handleAddProduct} loading={savingProduct} />
          </Card>
        )}

        {/* Products List */}
        {selectedPpgId && (
          <Card>
            <SectionHeader title={`Products (${products.length})`} icon="🗂️" />
            {productsLoading && <Text style={s.muted}>Loading...</Text>}
            {!productsLoading && products.length === 0 && (
              <Text style={s.muted}>No products added for this PPG yet.</Text>
            )}
            <FlatList
              data={products}
              keyExtractor={(item) => String(item.id)}
              renderItem={renderProductItem}
              scrollEnabled={false}
            />
          </Card>
        )}
      </ScrollView>
    </ScreenShell>
  );
}

const s = StyleSheet.create({
  listWrap: { marginTop: 14 },
  listHeader: { fontSize: 13, fontWeight: '600', color: theme.muted, marginBottom: 8 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    backgroundColor: theme.greenPale,
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: theme.greenBorder,
  },
  chipText: { fontSize: 12, fontWeight: '600', color: theme.green },
  muted: { fontSize: 13, color: theme.muted, paddingVertical: 8 },
  productRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  productPpgId: { 
  fontSize: 10, 
  color: '#999', 
  marginTop: 2 
},
  productInfo: { flex: 1 },
  productName: { fontSize: 14, fontWeight: '600', color: '#333' },
  productUnit: { fontSize: 12, color: theme.muted, marginTop: 2 },
  deleteText: { fontSize: 13, color: '#dc3545', fontWeight: '600' },
  selectedPpgInfo: {
    marginTop: 10,
    padding: 12,
    backgroundColor: theme.greenPale,
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: theme.green,
  },
  selectedPpgText: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.green,
  },
});