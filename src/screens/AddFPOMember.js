// src/screens/AddFPOMember.js
import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  SafeAreaView,
} from 'react-native';
import {
  Card,
  TextInput,
  Button,
  Text,
  Divider,
} from 'react-native-paper';
import { Picker } from '@react-native-picker/picker';

const AddFPOMember = ({ navigation }) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    uniqueId: `FPO${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
    state: '',
    district: '',
    location: '',
    phone: '',
    email: '',
    address: '',
  });

  const handleSubmit = async () => {
    if (!formData.name || !formData.state) {
      Alert.alert('Validation Error', 'Please fill all required fields');
      return;
    }

    setLoading(true);
    try {
      Alert.alert(
        'Success',
        'FPO Member added successfully!',
        [
          {
            text: 'OK',
            onPress: () => navigation.goBack(),
          },
        ]
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to add member');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView showsVerticalScrollIndicator={false}>
          <Card style={styles.card}>
            <Card.Content>
              <Text style={styles.title}>Add New FPO Member</Text>
              <Divider style={styles.divider} />

              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Member Information</Text>
                <TextInput
                  label="Full Name *"
                  value={formData.name}
                  onChangeText={(text) => setFormData(prev => ({ ...prev, name: text }))}
                  mode="outlined"
                  style={styles.input}
                  theme={{ colors: { primary: '#E65100' } }}
                />
                <TextInput
                  label="Unique ID"
                  value={formData.uniqueId}
                  mode="outlined"
                  style={styles.input}
                  theme={{ colors: { primary: '#E65100' } }}
                  disabled
                />
                <TextInput
                  label="Phone Number"
                  value={formData.phone}
                  onChangeText={(text) => setFormData(prev => ({ ...prev, phone: text }))}
                  mode="outlined"
                  style={styles.input}
                  theme={{ colors: { primary: '#E65100' } }}
                  keyboardType="phone-pad"
                />
                <TextInput
                  label="Email"
                  value={formData.email}
                  onChangeText={(text) => setFormData(prev => ({ ...prev, email: text }))}
                  mode="outlined"
                  style={styles.input}
                  theme={{ colors: { primary: '#E65100' } }}
                  keyboardType="email-address"
                />
              </View>

              <Divider style={styles.divider} />

              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Location Details</Text>
                <View style={styles.pickerContainer}>
                  <Text style={styles.pickerLabel}>State *</Text>
                  <View style={styles.pickerWrapper}>
                    <Picker
                      selectedValue={formData.state}
                      onValueChange={(itemValue) => setFormData(prev => ({ ...prev, state: itemValue }))}
                      style={styles.picker}
                    >
                      <Picker.Item label="Select State" value="" />
                      <Picker.Item label="Maharashtra" value="MH" />
                      <Picker.Item label="Gujarat" value="GJ" />
                      <Picker.Item label="Karnataka" value="KA" />
                    </Picker>
                  </View>
                </View>
              </View>

              <View style={styles.buttonContainer}>
                <Button
                  mode="contained"
                  onPress={handleSubmit}
                  loading={loading}
                  disabled={loading}
                  style={[styles.submitButton, { backgroundColor: '#E65100' }]}
                  icon="account-plus"
                >
                  {loading ? 'Adding...' : 'Add Member'}
                </Button>
                <Button
                  mode="outlined"
                  onPress={() => navigation.goBack()}
                  style={styles.cancelButton}
                  labelStyle={{ color: '#E65100' }}
                >
                  Cancel
                </Button>
              </View>
            </Card.Content>
          </Card>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  card: {
    margin: 15,
    borderRadius: 16,
    elevation: 4,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#E65100',
    textAlign: 'center',
  },
  divider: {
    marginVertical: 15,
    backgroundColor: '#FFF3E0',
  },
  section: {
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#E65100',
    marginBottom: 12,
  },
  input: {
    marginBottom: 10,
    backgroundColor: '#fff',
  },
  pickerContainer: {
    marginBottom: 10,
  },
  pickerLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    marginBottom: 4,
  },
  pickerWrapper: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    backgroundColor: '#fff',
    overflow: 'hidden',
  },
  picker: {
    height: 50,
  },
  buttonContainer: {
    marginTop: 20,
    gap: 10,
  },
  submitButton: {
    borderRadius: 12,
    paddingVertical: 4,
  },
  cancelButton: {
    borderRadius: 12,
    borderColor: '#E65100',
    paddingVertical: 4,
  },
});

export default AddFPOMember;