import React, { createContext, useContext, useState, useEffect } from 'react';
import { InventoryItem, LabCode, InventoryCategory, InventoryCondition } from '../types';
import { DEFAULT_INVENTORY, getStoredInventory, saveInventory } from '../data/inventoryData';

interface InventoryContextType {
  items: InventoryItem[];
  filterLab: LabCode | 'ALL';
  setFilterLab: (lab: LabCode | 'ALL') => void;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  selectedCategory: string;
  setSelectedCategory: (cat: string) => void;
  selectedCondition: string;
  setSelectedCondition: (cond: string) => void;
  addItem: (item: Omit<InventoryItem, 'id' | 'lastInspectedAt'>) => { success: boolean; item?: InventoryItem; error?: string };
  updateItem: (id: string, updates: Partial<InventoryItem>) => { success: boolean; error?: string };
  deleteItem: (id: string) => { success: boolean; error?: string };
  adjustQuantity: (id: string, good: number, minor: number, heavy: number) => { success: boolean; error?: string };
  resetInventory: () => void;
  exportToCSV: (labFilter?: LabCode | 'ALL') => void;
}

const InventoryContext = createContext<InventoryContextType>({
  items: [],
  filterLab: 'ALL',
  setFilterLab: () => {},
  searchQuery: '',
  setSearchQuery: () => {},
  selectedCategory: 'ALL',
  setSelectedCategory: () => {},
  selectedCondition: 'ALL',
  setSelectedCondition: () => {},
  addItem: () => ({ success: false }),
  updateItem: () => ({ success: false }),
  deleteItem: () => ({ success: false }),
  adjustQuantity: () => ({ success: false }),
  resetInventory: () => {},
  exportToCSV: () => {},
});

export const InventoryProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [filterLab, setFilterLab] = useState<LabCode | 'ALL'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [selectedCondition, setSelectedCondition] = useState('ALL');

  useEffect(() => {
    const loaded = getStoredInventory();
    setItems(loaded);
  }, []);

  const addItem = (data: Omit<InventoryItem, 'id' | 'lastInspectedAt'>) => {
    const cleanCode = data.itemCode.trim().toUpperCase();
    if (!cleanCode) {
      return { success: false, error: 'Kode Alat tidak boleh kosong.' };
    }

    const exists = items.some(i => i.itemCode.trim().toUpperCase() === cleanCode);
    if (exists) {
      return { success: false, error: `Kode Alat "${cleanCode}" sudah terdaftar.` };
    }

    const totalCalculated = Number(data.quantityGood || 0) + Number(data.quantityMinorDamage || 0) + Number(data.quantityHeavyDamage || 0);

    const newItem: InventoryItem = {
      ...data,
      id: `inv-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      itemCode: cleanCode,
      quantityTotal: totalCalculated > 0 ? totalCalculated : Number(data.quantityTotal || 1),
      quantityGood: Number(data.quantityGood || 0),
      quantityMinorDamage: Number(data.quantityMinorDamage || 0),
      quantityHeavyDamage: Number(data.quantityHeavyDamage || 0),
      lastInspectedAt: new Date().toISOString().slice(0, 10),
    };

    const updated = [newItem, ...items];
    setItems(updated);
    saveInventory(updated);
    return { success: true, item: newItem };
  };

  const updateItem = (id: string, updates: Partial<InventoryItem>) => {
    if (updates.itemCode) {
      const cleanCode = updates.itemCode.trim().toUpperCase();
      const conflict = items.find(i => i.id !== id && i.itemCode.trim().toUpperCase() === cleanCode);
      if (conflict) {
        return { success: false, error: `Kode Alat "${cleanCode}" sudah digunakan alat lain.` };
      }
      updates.itemCode = cleanCode;
    }

    const updated = items.map(item => {
      if (item.id === id) {
        const merged = { ...item, ...updates };
        // Recalculate total if conditions updated
        if (updates.quantityGood !== undefined || updates.quantityMinorDamage !== undefined || updates.quantityHeavyDamage !== undefined) {
          merged.quantityTotal =
            Number(merged.quantityGood || 0) +
            Number(merged.quantityMinorDamage || 0) +
            Number(merged.quantityHeavyDamage || 0);
        }
        return merged;
      }
      return item;
    });

    setItems(updated);
    saveInventory(updated);
    return { success: true };
  };

  const deleteItem = (id: string) => {
    const updated = items.filter(i => i.id !== id);
    setItems(updated);
    saveInventory(updated);
    return { success: true };
  };

  const adjustQuantity = (id: string, good: number, minor: number, heavy: number) => {
    return updateItem(id, {
      quantityGood: Math.max(0, good),
      quantityMinorDamage: Math.max(0, minor),
      quantityHeavyDamage: Math.max(0, heavy),
      quantityTotal: Math.max(0, good) + Math.max(0, minor) + Math.max(0, heavy),
      lastInspectedAt: new Date().toISOString().slice(0, 10),
    });
  };

  const resetInventory = () => {
    setItems(DEFAULT_INVENTORY);
    saveInventory(DEFAULT_INVENTORY);
  };

  const exportToCSV = (targetLab?: LabCode | 'ALL') => {
    const activeLab = targetLab || filterLab;
    const exportList = activeLab === 'ALL' ? items : items.filter(i => i.labCode === activeLab);

    const headers = [
      'Kode Alat',
      'Nama Alat',
      'Merk & Model',
      'Laboratorium',
      'Kategori',
      'Total Unit',
      'Kondisi Baik',
      'Rusak Ringan',
      'Rusak Berat',
      'Status',
      'Lokasi Penyimpanan',
      'Tahun Pengadaan',
      'Sumber Dana',
      'Pemeriksa Terakhir',
      'Spesifikasi',
    ];

    const rows = exportList.map(i => [
      `"${i.itemCode}"`,
      `"${i.name.replace(/"/g, '""')}"`,
      `"${i.brandModel.replace(/"/g, '""')}"`,
      `"${i.labCode}"`,
      `"${i.category}"`,
      i.quantityTotal,
      i.quantityGood,
      i.quantityMinorDamage,
      i.quantityHeavyDamage,
      `"${i.status}"`,
      `"${i.storageLocation.replace(/"/g, '""')}"`,
      i.procurementYear,
      `"${i.fundingSource}"`,
      `"${i.inspectedBy}"`,
      `"${i.specs.replace(/"/g, '""')}"`,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,\uFEFF' +
      [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    const filename = `inventaris-laboratorium-${activeLab}-${new Date().toISOString().slice(0, 10)}.csv`;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <InventoryContext.Provider
      value={{
        items,
        filterLab,
        setFilterLab,
        searchQuery,
        setSearchQuery,
        selectedCategory,
        setSelectedCategory,
        selectedCondition,
        setSelectedCondition,
        addItem,
        updateItem,
        deleteItem,
        adjustQuantity,
        resetInventory,
        exportToCSV,
      }}
    >
      {children}
    </InventoryContext.Provider>
  );
};

export const useInventory = () => useContext(InventoryContext);
