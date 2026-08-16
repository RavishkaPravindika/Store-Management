import React, { useEffect, useState, useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { dbStores, dbCategories, dbRacks, dbItems } from '../lib/db';
import { Store, Category, Rack, Item } from '../types';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { Modal } from '../components/ui/Modal';
import { Card, CardContent } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell
} from '../components/ui/Table';
import {
  PlusIcon,
  EditIcon,
  TrashIcon,
  LayersIcon,
  TagsIcon,
  PackageIcon,
  GridIcon,
  ListIcon,
  XIcon,
  SearchIcon,
  FilterIcon,
  RotateCcwIcon,
  InfoIcon,
  CheckCircle2Icon,
  BoxesIcon
} from 'lucide-react';

type Tab = 'items' | 'racks' | 'categories';

export const Inventory: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>('items');
  const [stores, setStores] = useState<Store[]>([]);
  const [selectedStoreId, setSelectedStoreId] = useState<string>('');

  // Data states from Realtime Database
  const [categories, setCategories] = useState<Category[]>([]);
  const [racks, setRacks] = useState<Rack[]>([]);
  const [items, setItems] = useState<Item[]>([]);

  // Search and Filter States
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filterCategoryId, setFilterCategoryId] = useState<string>('all');
  const [filterRackId, setFilterRackId] = useState<string>('all');

  // View states
  const [selectedRackId, setSelectedRackId] = useState<string>('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Slot Detail Modal (for multi-item and single-item slot inspection)
  const [slotModalInfo, setSlotModalInfo] = useState<{
    isOpen: boolean;
    row: number;
    col: number;
    rackId: string;
    isEditingName?: boolean;
    newSlotName?: string;
  }>({
    isOpen: false,
    row: 0,
    col: 0,
    rackId: '',
    isEditingName: false,
    newSlotName: ''
  });

  // Modal states
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [isRackModalOpen, setIsRackModalOpen] = useState(false);
  const [isItemModalOpen, setIsItemModalOpen] = useState(false);

  // Form states
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [categoryForm, setCategoryForm] = useState({ name: '', description: '' });

  const [editingRack, setEditingRack] = useState<Rack | null>(null);
  const [rackForm, setRackForm] = useState({ name: '', rows: 4, cols: 4 });

  const [editingItem, setEditingItem] = useState<Item | null>(null);
  const [itemForm, setItemForm] = useState({
    name: '',
    description: '',
    categoryId: '',
    rackId: '',
    row: 0,
    col: 0
  });
  const [itemAttributes, setItemAttributes] = useState<{ key: string; value: string }[]>([]);

  // 1. Subscribe to Stores, Categories, Racks, Items in Realtime
  useEffect(() => {
    const unsubStores = dbStores.subscribe((storeList) => {
      let availableStores = storeList;
      if (user?.role === 'user') {
        availableStores = storeList.filter((s) => user.assignedStores?.includes(s.id));
      }
      setStores(availableStores);
      if (availableStores.length > 0 && !selectedStoreId) {
        setSelectedStoreId(availableStores[0].id);
      }
    });

    const unsubCategories = dbCategories.subscribe((catList) => {
      setCategories(catList);
    });

    const unsubRacks = dbRacks.subscribe((rackList) => {
      setRacks(rackList);
    });

    const unsubItems = dbItems.subscribe((itemList) => {
      setItems(itemList);
    });

    return () => {
      unsubStores();
      unsubCategories();
      unsubRacks();
      unsubItems();
    };
  }, [user]);

  // Current store racks
  const currentStoreRacks = useMemo(() => {
    return racks.filter((r) => r.storeId === selectedStoreId);
  }, [racks, selectedStoreId]);

  // Sync selectedRackId when store racks change
  useEffect(() => {
    if (currentStoreRacks.length > 0) {
      if (!currentStoreRacks.some((r) => r.id === selectedRackId)) {
        setSelectedRackId(currentStoreRacks[0].id);
      }
    } else {
      setSelectedRackId('');
    }
  }, [currentStoreRacks, selectedRackId]);

  // Active rack object
  const currentRack = useMemo(() => {
    return currentStoreRacks.find((r) => r.id === selectedRackId);
  }, [currentStoreRacks, selectedRackId]);

  // Filtered items based on Search Query, Category, and Rack filters
  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      // Must belong to current store
      if (item.storeId !== selectedStoreId) return false;

      // Filter by Rack if specified in filter dropdown
      if (filterRackId !== 'all' && item.rackId !== filterRackId) {
        return false;
      }

      // Filter by Category
      if (filterCategoryId !== 'all' && item.categoryId !== filterCategoryId) {
        return false;
      }

      // Search Query filter
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const matchesName = item.name.toLowerCase().includes(query);
        const matchesDesc = (item.description || '').toLowerCase().includes(query);
        const catName = (categories.find((c) => c.id === item.categoryId)?.name || '').toLowerCase();
        const matchesCategory = catName.includes(query);
        const rackName = (racks.find((r) => r.id === item.rackId)?.name || '').toLowerCase();
        const matchesRack = rackName.includes(query);
        const matchesAttrs = Object.entries(item.attributes || {}).some(
          ([k, v]) => k.toLowerCase().includes(query) || v.toLowerCase().includes(query)
        );

        return matchesName || matchesDesc || matchesCategory || matchesRack || matchesAttrs;
      }

      return true;
    });
  }, [items, selectedStoreId, filterRackId, filterCategoryId, searchQuery, categories, racks]);

  const hasActiveFilters = searchQuery.trim() !== '' || filterCategoryId !== 'all' || filterRackId !== 'all';

  const clearFilters = () => {
    setSearchQuery('');
    setFilterCategoryId('all');
    setFilterRackId('all');
  };

  // --- Category Handlers ---
  const handleOpenCategoryModal = (cat?: Category) => {
    if (cat) {
      setEditingCategory(cat);
      setCategoryForm({ name: cat.name, description: cat.description || '' });
    } else {
      setEditingCategory(null);
      setCategoryForm({ name: '', description: '' });
    }
    setIsCategoryModalOpen(true);
  };

  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingCategory) {
      await dbCategories.update(editingCategory.id, categoryForm);
    } else {
      await dbCategories.create(categoryForm);
    }
    setIsCategoryModalOpen(false);
  };

  const handleDeleteCategory = async (id: string) => {
    if (window.confirm('Delete this category? Items in this category will become Uncategorized.')) {
      await dbCategories.delete(id);
    }
  };

  // --- Rack Handlers ---
  const handleOpenRackModal = (rack?: Rack) => {
    if (rack) {
      setEditingRack(rack);
      setRackForm({
        name: rack.name,
        rows: rack.rows,
        cols: rack.cols
      });
    } else {
      setEditingRack(null);
      setRackForm({
        name: '',
        rows: 4,
        cols: 4
      });
    }
    setIsRackModalOpen(true);
  };

  const handleSaveRack = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingRack) {
      await dbRacks.update(editingRack.id, rackForm);
    } else {
      const newRack = await dbRacks.create({
        ...rackForm,
        storeId: selectedStoreId
      });
      setSelectedRackId(newRack.id);
    }
    setIsRackModalOpen(false);
  };

  const handleDeleteRack = async (id: string) => {
    if (window.confirm('Delete this rack and remove all its items?')) {
      await dbRacks.delete(id);
      const rackItems = items.filter((i) => i.rackId === id);
      for (const item of rackItems) {
        await dbItems.delete(item.id);
      }
      if (selectedRackId === id) {
        const remaining = currentStoreRacks.filter((r) => r.id !== id);
        setSelectedRackId(remaining.length > 0 ? remaining[0].id : '');
      }
    }
  };

  // --- Item Handlers ---
  const handleOpenItemModal = (
    item?: Item,
    presetRow: number = 0,
    presetCol: number = 0,
    presetRackId?: string
  ) => {
    const activeRackTarget = presetRackId || selectedRackId || (currentStoreRacks[0]?.id || '');
    if (item) {
      setEditingItem(item);
      setItemForm({
        name: item.name,
        description: item.description || '',
        categoryId: item.categoryId || (categories[0]?.id || ''),
        rackId: item.rackId || activeRackTarget,
        row: item.row ?? 0,
        col: item.col ?? 0
      });
      setItemAttributes(
        Object.entries(item.attributes || {}).map(([key, value]) => ({ key, value }))
      );
    } else {
      setEditingItem(null);
      setItemForm({
        name: '',
        description: '',
        categoryId: categories.length > 0 ? categories[0].id : '',
        rackId: activeRackTarget,
        row: presetRow,
        col: presetCol
      });
      setItemAttributes([]);
    }
    setIsItemModalOpen(true);
  };

  const handleSaveItem = async (e: React.FormEvent) => {
    e.preventDefault();
    const attributesRecord: Record<string, string> = {};
    itemAttributes.forEach((attr) => {
      if (attr.key.trim()) attributesRecord[attr.key.trim()] = attr.value;
    });

    const itemData = {
      name: itemForm.name,
      description: itemForm.description,
      categoryId: itemForm.categoryId,
      rackId: itemForm.rackId || selectedRackId,
      storeId: selectedStoreId,
      row: Number(itemForm.row) || 0,
      col: Number(itemForm.col) || 0,
      attributes: attributesRecord
    };

    if (editingItem) {
      await dbItems.update(editingItem.id, itemData);
    } else {
      await dbItems.create(itemData);
    }
    setIsItemModalOpen(false);
  };

  const handleDeleteItem = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this item?')) {
      await dbItems.delete(id);
    }
  };

  const addAttribute = () => {
    setItemAttributes([...itemAttributes, { key: '', value: '' }]);
  };

  const updateAttribute = (index: number, field: 'key' | 'value', val: string) => {
    const newAttrs = [...itemAttributes];
    newAttrs[index][field] = val;
    setItemAttributes(newAttrs);
  };

  const removeAttribute = (index: number) => {
    setItemAttributes(itemAttributes.filter((_, i) => i !== index));
  };

  // --- Multi-Item Slot Modal Helper ---
  const handleOpenSlotModal = (row: number, col: number, rackId: string) => {
    setSlotModalInfo({
      isOpen: true,
      row,
      col,
      rackId
    });
  };

  const slotModalItems = useMemo(() => {
    if (!slotModalInfo.isOpen) return [];
    return items.filter(
      (i) =>
        i.rackId === slotModalInfo.rackId &&
        i.row === slotModalInfo.row &&
        i.col === slotModalInfo.col
    );
  }, [items, slotModalInfo]);

  const handleSaveSlotName = async () => {
    const rack = racks.find(r => r.id === slotModalInfo.rackId);
    if (!rack || (user?.role !== 'super-admin' && user?.role !== 'admin')) return;
    const slotKey = `${slotModalInfo.row}-${slotModalInfo.col}`;
    const updatedSlotNames = { ...(rack.slotNames || {}) };
    if (slotModalInfo.newSlotName?.trim()) {
      updatedSlotNames[slotKey] = slotModalInfo.newSlotName.trim();
    } else {
      delete updatedSlotNames[slotKey];
    }
    await dbRacks.update(rack.id, { slotNames: updatedSlotNames });
    setSlotModalInfo(prev => ({ ...prev, isEditingName: false }));
  };

  // --- RENDER GRID WITH MULTI-ITEM SUPPORT ---
  const renderGrid = () => {
    if (!currentRack) {
      return (
        <div className="text-center py-12 bg-white rounded-xl border border-dashed border-gray-300">
          <LayersIcon className="mx-auto h-12 w-12 text-gray-300 mb-3" />
          <h3 className="text-lg font-semibold text-gray-800">No Rack Selected</h3>
          <p className="text-gray-500 text-sm mt-1">
            Please create or select a rack to view its inventory grid slots.
          </p>
        </div>
      );
    }

    // All items belonging to current rack
    const rackAllItems = items.filter((i) => i.rackId === currentRack.id);

    const gridRows = [];
    for (let r = 0; r < currentRack.rows; r++) {
      const rowCells = [];
      for (let c = 0; c < currentRack.cols; c++) {
        // Find ALL items in this slot
        const slotItems = rackAllItems.filter((i) => i.row === r && i.col === c);
        const hasItems = slotItems.length > 0;

        // Check if any item in this slot matches the current active search filter
        const matchingSlotItems = slotItems.filter((item) =>
          filteredItems.some((fi) => fi.id === item.id)
        );
        const isSlotMatchingFilter = matchingSlotItems.length > 0;
        const isDimmedByFilter = hasActiveFilters && !isSlotMatchingFilter && hasItems;

        rowCells.push(
          <div
            key={`${r}-${c}`}
            onClick={() => {
              if (slotItems.length === 0) {
                // Empty slot -> Add item directly
                handleOpenItemModal(undefined, r, c, currentRack.id);
              } else {
                // Slot with 1 or many items -> Open Slot Details Modal for rich multi-item management
                handleOpenSlotModal(r, c, currentRack.id);
              }
            }}
            className={`
              relative rounded-xl p-3 min-h-[120px] w-48 sm:w-52 flex flex-col justify-between cursor-pointer transition-all duration-200 border
              ${
                !hasItems
                  ? 'bg-slate-50/80 border-dashed border-slate-300 hover:border-blue-400 hover:bg-blue-50/40'
                  : hasActiveFilters && isSlotMatchingFilter
                  ? 'bg-amber-50/90 border-2 border-amber-500 shadow-md ring-2 ring-amber-400/30'
                  : isDimmedByFilter
                  ? 'bg-slate-100/60 border-slate-200 opacity-40 hover:opacity-100'
                  : slotItems.length > 1
                  ? 'bg-gradient-to-br from-indigo-50/90 to-blue-50/90 border-indigo-200 hover:border-indigo-400 hover:shadow-md'
                  : 'bg-white border-blue-200 hover:border-blue-400 hover:shadow-md'
              }
            `}
          >
            {/* Slot Coordinate Header */}
            <div className="flex items-center justify-between text-[11px] font-semibold text-gray-500 mb-1 border-b border-gray-100 pb-1">
              <span className="bg-slate-200/80 text-slate-700 px-1.5 py-0.5 rounded text-[10px] font-mono truncate max-w-[80px]" title={currentRack.slotNames?.[`${r}-${c}`] || `R${r}:C${c}`}>
                {currentRack.slotNames?.[`${r}-${c}`] || `R${r}:C${c}`}
              </span>

              {slotItems.length > 1 ? (
                <span className="flex items-center gap-1 bg-indigo-600 text-white font-bold text-[11px] px-2 py-0.5 rounded-full shadow-sm">
                  <BoxesIcon className="h-3 w-3" />
                  {slotItems.length} Items
                </span>
              ) : slotItems.length === 1 ? (
                <span className="text-[10px] bg-blue-100 text-blue-800 font-medium px-1.5 py-0.5 rounded-full">
                  1 Item
                </span>
              ) : (
                <span className="text-[10px] text-gray-400 font-normal">Empty</span>
              )}
            </div>

            {/* Slot Content Body */}
            {slotItems.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center py-2 group">
                <div className="p-2 rounded-full bg-slate-200/50 text-slate-400 group-hover:bg-blue-100 group-hover:text-blue-600 transition-colors mb-1">
                  <PlusIcon className="h-4 w-4" />
                </div>
                <span className="text-xs text-gray-400 group-hover:text-blue-600 font-medium transition-colors">
                  Add Item
                </span>
              </div>
            ) : slotItems.length === 1 ? (
              // SINGLE ITEM IN SLOT
              <div className="flex-1 flex flex-col justify-center py-1">
                <div className="flex items-center gap-1.5 mb-1">
                  <PackageIcon className="h-4 w-4 text-blue-600 shrink-0" />
                  <span
                    className="text-xs font-semibold text-gray-900 truncate"
                    title={slotItems[0].name}
                  >
                    {slotItems[0].name}
                  </span>
                </div>
                <div className="flex items-center justify-between mt-auto text-[10px]">
                  <span className="bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded truncate max-w-[100px]">
                    {categories.find((cat) => cat.id === slotItems[0].categoryId)?.name ||
                      'General'}
                  </span>
                  {Object.keys(slotItems[0].attributes || {}).length > 0 && (
                    <span className="text-gray-400 font-mono">
                      +{Object.keys(slotItems[0].attributes || {}).length} attrs
                    </span>
                  )}
                </div>
              </div>
            ) : (
              // MULTIPLE ITEMS IN SAME SLOT
              <div className="flex-1 flex flex-col justify-between py-1 space-y-1">
                <div className="space-y-1">
                  {slotItems.slice(0, 2).map((item, idx) => (
                    <div
                      key={item.id || idx}
                      className="text-[11px] bg-white/90 border border-indigo-100 rounded px-1.5 py-0.5 flex items-center justify-between shadow-2xs"
                    >
                      <span className="font-medium text-gray-800 truncate max-w-[110px]">
                        {item.name}
                      </span>
                      <span className="text-[9px] text-indigo-600 bg-indigo-50 px-1 rounded">
                        {categories.find((cat) => cat.id === item.categoryId)?.name || 'Item'}
                      </span>
                    </div>
                  ))}
                </div>

                {slotItems.length > 2 && (
                  <p className="text-[10px] font-semibold text-indigo-700 text-center bg-indigo-100/70 rounded py-0.5">
                    +{slotItems.length - 2} more in this slot
                  </p>
                )}
              </div>
            )}

            {/* Matching Search Highlight Banner */}
            {hasActiveFilters && isSlotMatchingFilter && (
              <div className="mt-1 pt-1 border-t border-amber-200 flex items-center justify-between text-[10px] text-amber-800 font-medium">
                <span className="flex items-center gap-1">
                  <CheckCircle2Icon className="h-3 w-3 text-amber-600" />
                  {matchingSlotItems.length} match
                </span>
                <span className="underline">View</span>
              </div>
            )}
          </div>
        );
      }
      gridRows.push(
        <div key={r} className="flex gap-3">
          {rowCells}
        </div>
      );
    }

    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between text-xs text-gray-500 px-1">
          <div className="flex items-center gap-4">
            <span className="font-semibold text-gray-700">
              Rack: {currentRack.name} ({currentRack.rows} Rows × {currentRack.cols} Columns ={' '}
              {currentRack.rows * currentRack.cols} Slots)
            </span>
            <span className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full font-medium">
              {rackAllItems.length} total items in rack
            </span>
          </div>
          <span className="text-gray-400">💡 Click any slot to view or add multiple items</span>
        </div>

        <div className="overflow-x-auto p-5 bg-white border border-gray-200 rounded-2xl shadow-inner">
          <div className="inline-flex flex-col gap-3 min-w-max">{gridRows}</div>
        </div>
      </div>
    );
  };

  if (stores.length === 0) {
    return (
      <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-gray-200">
        <PackageIcon className="mx-auto h-12 w-12 text-gray-300 mb-3" />
        <h2 className="text-xl font-bold text-gray-900">No Stores Available</h2>
        <p className="text-gray-500 text-sm mt-1">
          Create or get assigned to a store location to manage inventory.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Header: Title and Store Selector */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
            Inventory & Rack Management
          </h1>
          <p className="text-gray-500 text-sm mt-0.5">
            Store racks, dynamic slot allocations, and multi-attribute stock tracking
          </p>
        </div>

        <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-xl border border-gray-200 shadow-sm">
          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
            Active Store:
          </span>
          <Select
            value={selectedStoreId}
            onChange={(e) => setSelectedStoreId(e.target.value)}
            options={stores.map((s) => ({
              value: s.id,
              label: `${s.name} (${s.location})`
            }))}
            className="border-none shadow-none focus:ring-0 w-56 font-semibold text-blue-700"
          />
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200">
        <button
          className={`flex items-center gap-2 px-5 py-3 text-sm font-semibold border-b-2 transition-colors ${
            activeTab === 'items'
              ? 'border-blue-600 text-blue-600 bg-blue-50/50 rounded-t-lg'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
          }`}
          onClick={() => setActiveTab('items')}
        >
          <PackageIcon className="h-4 w-4" /> Items & Slots
        </button>
        <button
          className={`flex items-center gap-2 px-5 py-3 text-sm font-semibold border-b-2 transition-colors ${
            activeTab === 'racks'
              ? 'border-blue-600 text-blue-600 bg-blue-50/50 rounded-t-lg'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
          }`}
          onClick={() => setActiveTab('racks')}
        >
          <LayersIcon className="h-4 w-4" /> Racks ({currentStoreRacks.length})
        </button>
        <button
          className={`flex items-center gap-2 px-5 py-3 text-sm font-semibold border-b-2 transition-colors ${
            activeTab === 'categories'
              ? 'border-blue-600 text-blue-600 bg-blue-50/50 rounded-t-lg'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
          }`}
          onClick={() => setActiveTab('categories')}
        >
          <TagsIcon className="h-4 w-4" /> Categories ({categories.length})
        </button>
      </div>

      {/* Tab 1: ITEMS & SLOTS */}
      {activeTab === 'items' && (
        <div className="space-y-5">
          {/* Dynamic Search & Multi-Filter Toolbar */}
          <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm space-y-3">
            <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3">
              {/* Dynamic Search Bar */}
              <div className="relative flex-1">
                <SearchIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search items by name, description, brand, color, or attributes..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 h-10 rounded-xl"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    <XIcon className="h-4 w-4" />
                  </button>
                )}
              </div>

              {/* Category Filter */}
              <div className="w-full md:w-52">
                <Select
                  value={filterCategoryId}
                  onChange={(e) => setFilterCategoryId(e.target.value)}
                  options={[
                    { value: 'all', label: 'All Categories' },
                    ...categories.map((c) => ({ value: c.id, label: c.name }))
                  ]}
                  className="h-10 rounded-xl"
                />
              </div>

              {/* Rack Filter */}
              <div className="w-full md:w-52">
                <Select
                  value={filterRackId}
                  onChange={(e) => {
                    setFilterRackId(e.target.value);
                    if (e.target.value !== 'all') {
                      setSelectedRackId(e.target.value);
                    }
                  }}
                  options={[
                    { value: 'all', label: 'All Racks in Store' },
                    ...currentStoreRacks.map((r) => ({ value: r.id, label: r.name }))
                  ]}
                  className="h-10 rounded-xl"
                />
              </div>

              {/* View Switcher & Add Item Button */}
              <div className="flex items-center gap-2 shrink-0">
                <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200">
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`p-2 rounded-lg transition-all ${
                      viewMode === 'grid'
                        ? 'bg-white shadow-xs text-blue-600 font-semibold'
                        : 'text-gray-500 hover:text-gray-800'
                    }`}
                    title="Grid Slot View"
                  >
                    <GridIcon className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => setViewMode('list')}
                    className={`p-2 rounded-lg transition-all ${
                      viewMode === 'list'
                        ? 'bg-white shadow-xs text-blue-600 font-semibold'
                        : 'text-gray-500 hover:text-gray-800'
                    }`}
                    title="Table List View"
                  >
                    <ListIcon className="h-4 w-4" />
                  </button>
                </div>

                <Button
                  onClick={() => handleOpenItemModal()}
                  className="flex items-center gap-2 h-10 px-4 rounded-xl shadow-sm"
                >
                  <PlusIcon className="h-4 w-4" /> Add Item
                </Button>
              </div>
            </div>

            {/* Active Filters Pill Bar */}
            {hasActiveFilters && (
              <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-gray-100 text-xs">
                <span className="flex items-center gap-1 text-gray-500 font-semibold">
                  <FilterIcon className="h-3 w-3 text-blue-600" /> Active Filters:
                </span>

                {searchQuery.trim() && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-50 text-blue-700 rounded-full font-medium border border-blue-200">
                    Query: "{searchQuery}"
                    <button onClick={() => setSearchQuery('')}>
                      <XIcon className="h-3 w-3" />
                    </button>
                  </span>
                )}

                {filterCategoryId !== 'all' && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-purple-50 text-purple-700 rounded-full font-medium border border-purple-200">
                    Category: {categories.find((c) => c.id === filterCategoryId)?.name}
                    <button onClick={() => setFilterCategoryId('all')}>
                      <XIcon className="h-3 w-3" />
                    </button>
                  </span>
                )}

                {filterRackId !== 'all' && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-indigo-50 text-indigo-700 rounded-full font-medium border border-indigo-200">
                    Rack: {currentStoreRacks.find((r) => r.id === filterRackId)?.name}
                    <button onClick={() => setFilterRackId('all')}>
                      <XIcon className="h-3 w-3" />
                    </button>
                  </span>
                )}

                <span className="ml-auto text-gray-500 font-medium">
                  Showing {filteredItems.length} matching {filteredItems.length === 1 ? 'item' : 'items'}
                </span>

                <button
                  onClick={clearFilters}
                  className="inline-flex items-center gap-1 text-xs text-red-600 hover:text-red-800 font-semibold ml-2 hover:underline"
                >
                  <RotateCcwIcon className="h-3 w-3" /> Reset Filters
                </button>
              </div>
            )}
          </div>

          {/* Racks Check */}
          {currentStoreRacks.length === 0 ? (
            <div className="text-center py-14 bg-white rounded-2xl border border-dashed border-gray-300">
              <LayersIcon className="mx-auto h-12 w-12 text-gray-300 mb-3" />
              <h3 className="text-lg font-bold text-gray-900">No Racks Available</h3>
              <p className="text-gray-500 text-sm mt-1 max-w-md mx-auto">
                You need to create at least one rack grid in this store before configuring item slots.
              </p>
              <Button
                onClick={() => {
                  setActiveTab('racks');
                  handleOpenRackModal();
                }}
                className="mt-4"
              >
                Create First Rack
              </Button>
            </div>
          ) : (
            <>
              {/* Rack Selector (if in Grid Mode) */}
              {viewMode === 'grid' && (
                <div className="flex items-center justify-between bg-white p-3.5 rounded-xl border border-gray-200 shadow-xs">
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                      Select Rack Grid:
                    </span>
                    <Select
                      value={selectedRackId}
                      onChange={(e) => {
                        setSelectedRackId(e.target.value);
                        if (filterRackId !== 'all') {
                          setFilterRackId(e.target.value);
                        }
                      }}
                      options={currentStoreRacks.map((r) => ({
                        value: r.id,
                        label: `${r.name} (${r.rows}x${r.cols})`
                      }))}
                      className="w-64 font-semibold text-gray-900"
                    />
                  </div>

                  <div className="text-xs text-gray-500 font-medium">
                    Total Slots: {(currentRack?.rows || 0) * (currentRack?.cols || 0)}
                  </div>
                </div>
              )}

              {/* VIEW: GRID vs LIST */}
              {viewMode === 'grid' ? (
                renderGrid()
              ) : (
                /* LIST VIEW */
                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Item Name & Details</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead>Rack & Slot Location</TableHead>
                        <TableHead>Attributes</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredItems.length === 0 ? (
                        <TableRow>
                          <TableCell
                            colSpan={5}
                            className="text-center py-12 text-gray-500"
                          >
                            <PackageIcon className="mx-auto h-8 w-8 text-gray-300 mb-2" />
                            No items found matching your filters in this store.
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredItems.map((item) => {
                          const itemRack = racks.find((r) => r.id === item.rackId);
                          const itemCat = categories.find((c) => c.id === item.categoryId);
                          return (
                            <TableRow key={item.id} className="hover:bg-slate-50/70">
                              <TableCell>
                                <div className="font-bold text-gray-900">{item.name}</div>
                                {item.description && (
                                  <div className="text-xs text-gray-500 font-normal mt-0.5 line-clamp-1">
                                    {item.description}
                                  </div>
                                )}
                              </TableCell>

                              <TableCell>
                                <Badge variant="info">
                                  {itemCat?.name || 'Uncategorized'}
                                </Badge>
                              </TableCell>

                              <TableCell>
                                <div className="flex flex-col">
                                  <span className="text-xs font-semibold text-gray-800">
                                    {itemRack?.name || 'Unknown Rack'}
                                  </span>
                                  <span className="text-[11px] font-mono text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded w-fit mt-0.5">
                                    Row {item.row}, Col {item.col}
                                  </span>
                                </div>
                              </TableCell>

                              <TableCell>
                                <div className="flex flex-wrap gap-1 max-w-xs">
                                  {Object.entries(item.attributes || {}).map(([k, v]) => (
                                    <span
                                      key={k}
                                      className="text-[11px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded border border-slate-200"
                                    >
                                      <strong className="text-slate-900">{k}:</strong> {v}
                                    </span>
                                  ))}
                                  {Object.keys(item.attributes || {}).length === 0 && (
                                    <span className="text-xs text-gray-400 italic">None</span>
                                  )}
                                </div>
                              </TableCell>

                              <TableCell className="text-right">
                                <div className="flex items-center justify-end gap-1">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleOpenItemModal(item)}
                                    className="text-blue-600 hover:text-blue-800 hover:bg-blue-50"
                                  >
                                    <EditIcon className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleDeleteItem(item.id)}
                                    className="text-red-600 hover:text-red-800 hover:bg-red-50"
                                  >
                                    <TrashIcon className="h-4 w-4" />
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          );
                        })
                      )}
                    </TableBody>
                  </Table>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* Tab 2: RACKS */}
      {activeTab === 'racks' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <p className="text-sm text-gray-500">
              Configure grid dimensions (rows × columns) for each storage rack.
            </p>
            <Button
              onClick={() => handleOpenRackModal()}
              className="flex items-center gap-2 shadow-sm"
            >
              <PlusIcon className="h-4 w-4" /> Add Rack
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {currentStoreRacks.map((rack) => {
              const rackItemCount = items.filter((i) => i.rackId === rack.id).length;
              return (
                <Card
                  key={rack.id}
                  className="hover:shadow-md transition-shadow border-gray-200"
                >
                  <CardContent className="p-5 flex flex-col justify-between h-full">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2 text-indigo-700 font-bold text-lg">
                          <LayersIcon className="h-5 w-5" />
                          {rack.name}
                        </div>
                        <span className="text-xs bg-indigo-50 text-indigo-700 font-semibold px-2 py-0.5 rounded-full">
                          {rack.rows * rack.cols} Slots
                        </span>
                      </div>

                      <div className="space-y-1 text-xs text-gray-600 mt-3">
                        <p>
                          <strong>Dimensions:</strong> {rack.rows} Rows × {rack.cols} Columns
                        </p>
                        <p>
                          <strong>Occupied Items:</strong> {rackItemCount} stored
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-end gap-2 pt-4 mt-4 border-t border-gray-100">
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => {
                          setSelectedRackId(rack.id);
                          setActiveTab('items');
                          setViewMode('grid');
                        }}
                        className="text-xs"
                      >
                        View Grid
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleOpenRackModal(rack)}
                        className="text-blue-600 hover:bg-blue-50"
                      >
                        <EditIcon className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteRack(rack.id)}
                        className="text-red-600 hover:bg-red-50"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}

            {currentStoreRacks.length === 0 && (
              <div className="col-span-full text-center py-12 bg-white rounded-2xl border border-dashed border-gray-300">
                <p className="text-gray-500 text-sm">No racks found for this store.</p>
                <Button
                  onClick={() => handleOpenRackModal()}
                  className="mt-3"
                  variant="secondary"
                >
                  Create First Rack
                </Button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab 3: CATEGORIES */}
      {activeTab === 'categories' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <p className="text-sm text-gray-500">
              Categorize store items for organized filtering and tracking.
            </p>
            <Button
              onClick={() => handleOpenCategoryModal()}
              className="flex items-center gap-2 shadow-sm"
            >
              <PlusIcon className="h-4 w-4" /> Add Category
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {categories.map((cat) => {
              const catItemCount = items.filter((i) => i.categoryId === cat.id).length;
              return (
                <Card
                  key={cat.id}
                  className="hover:shadow-md transition-shadow border-gray-200"
                >
                  <CardContent className="p-5 flex flex-col justify-between h-full">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2 font-bold text-gray-900 text-base">
                          <TagsIcon className="h-4 w-4 text-purple-600" />
                          {cat.name}
                        </div>
                        <span className="text-xs bg-purple-50 text-purple-700 font-semibold px-2 py-0.5 rounded-full">
                          {catItemCount} Items
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 line-clamp-2 mt-1">
                        {cat.description || 'No description provided.'}
                      </p>
                    </div>

                    <div className="flex items-center justify-end gap-2 pt-4 mt-4 border-t border-gray-100">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleOpenCategoryModal(cat)}
                        className="text-blue-600 hover:bg-blue-50"
                      >
                        <EditIcon className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteCategory(cat.id)}
                        className="text-red-600 hover:bg-red-50"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}

            {categories.length === 0 && (
              <div className="col-span-full text-center py-12 bg-white rounded-2xl border border-dashed border-gray-300">
                <p className="text-gray-500 text-sm">No categories configured.</p>
                <Button
                  onClick={() => handleOpenCategoryModal()}
                  className="mt-3"
                  variant="secondary"
                >
                  Create First Category
                </Button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 1: SLOT DETAILS MODAL (Multi-Item & Single-Item Slot Inspection) */}
      {/* ========================================================================= */}
      <Modal
        isOpen={slotModalInfo.isOpen}
        onClose={() => setSlotModalInfo({ ...slotModalInfo, isOpen: false })}
        title={`Slot Details: Row ${slotModalInfo.row}, Column ${slotModalInfo.col}`}
        maxWidth="2xl"
      >
        <div className="space-y-4">
          <div className="flex items-center justify-between bg-blue-50 p-3 rounded-xl border border-blue-200">
            <div className="flex items-center gap-2">
              <BoxesIcon className="h-5 w-5 text-blue-600" />
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="text-sm font-bold text-blue-950">
                    {slotModalInfo.isEditingName ? (
                      <div className="flex items-center gap-1">
                        <Input
                          autoFocus
                          className="h-7 text-xs w-40"
                          placeholder="e.g. Front Display"
                          value={slotModalInfo.newSlotName || ''}
                          onChange={(e) => setSlotModalInfo(prev => ({ ...prev, newSlotName: e.target.value }))}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleSaveSlotName();
                            if (e.key === 'Escape') setSlotModalInfo(prev => ({ ...prev, isEditingName: false }));
                          }}
                        />
                        <Button size="sm" className="h-7 px-2" onClick={handleSaveSlotName}>Save</Button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5">
                        <span>
                          {racks.find(r => r.id === slotModalInfo.rackId)?.slotNames?.[`${slotModalInfo.row}-${slotModalInfo.col}`] || 
                           `Row ${slotModalInfo.row}, Col ${slotModalInfo.col}`}
                        </span>
                        {(user?.role === 'super-admin' || user?.role === 'admin') && (
                          <button 
                            type="button"
                            onClick={() => setSlotModalInfo(prev => ({ 
                              ...prev, 
                              isEditingName: true, 
                              newSlotName: racks.find(r => r.id === slotModalInfo.rackId)?.slotNames?.[`${slotModalInfo.row}-${slotModalInfo.col}`] || ''
                            }))}
                            className="text-blue-500 hover:text-blue-700 p-1"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path></svg>
                          </button>
                        )}
                      </div>
                    )}
                  </h4>
                </div>
                <p className="text-xs text-blue-700 mt-0.5">
                  Rack: {racks.find((r) => r.id === slotModalInfo.rackId)?.name} • {slotModalItems.length} {slotModalItems.length === 1 ? 'Item' : 'Items'} in this Slot
                </p>
              </div>
            </div>

            {/* Quick Button to add another item to this exact slot */}
            <Button
              size="sm"
              onClick={() => {
                setSlotModalInfo({ ...slotModalInfo, isOpen: false });
                handleOpenItemModal(
                  undefined,
                  slotModalInfo.row,
                  slotModalInfo.col,
                  slotModalInfo.rackId
                );
              }}
              className="flex items-center gap-1.5 shadow-sm"
            >
              <PlusIcon className="h-4 w-4" /> Add Item to Slot
            </Button>
          </div>

          <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1">
            {slotModalItems.map((item, index) => {
              const cat = categories.find((c) => c.id === item.categoryId);
              return (
                <div
                  key={item.id || index}
                  className="p-4 rounded-xl border border-gray-200 bg-white hover:border-blue-300 transition-colors shadow-2xs space-y-2"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-gray-900 text-sm">{item.name}</span>
                        <Badge variant="info" className="text-[10px]">
                          {cat?.name || 'Uncategorized'}
                        </Badge>
                      </div>
                      {item.description && (
                        <p className="text-xs text-gray-500 mt-1">{item.description}</p>
                      )}
                    </div>

                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSlotModalInfo({ ...slotModalInfo, isOpen: false });
                          handleOpenItemModal(item);
                        }}
                        className="text-blue-600 hover:bg-blue-50"
                        title="Edit Item"
                      >
                        <EditIcon className="h-4 w-4 mr-1" /> Edit
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={async () => {
                          if (window.confirm(`Delete "${item.name}" from this slot?`)) {
                            await dbItems.delete(item.id);
                          }
                        }}
                        className="text-red-600 hover:bg-red-50"
                        title="Delete Item"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  {/* Attributes Pills */}
                  {Object.keys(item.attributes || {}).length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-2 border-t border-gray-100">
                      {Object.entries(item.attributes || {}).map(([k, v]) => (
                        <span
                          key={k}
                          className="text-[11px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded border border-slate-200 font-mono"
                        >
                          <strong className="text-slate-900">{k}:</strong> {v}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="pt-3 flex justify-end border-t border-gray-200">
            <Button
              variant="secondary"
              onClick={() => setSlotModalInfo({ ...slotModalInfo, isOpen: false })}
            >
              Close
            </Button>
          </div>
        </div>
      </Modal>

      {/* ========================================================================= */}
      {/* MODAL 2: ITEM CREATE / EDIT MODAL */}
      {/* ========================================================================= */}
      <Modal
        isOpen={isItemModalOpen}
        onClose={() => setIsItemModalOpen(false)}
        title={editingItem ? `Edit Item: ${editingItem.name}` : 'Add New Inventory Item'}
        maxWidth="2xl"
      >
        <form onSubmit={handleSaveItem} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Basic details */}
            <div className="space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500 border-b pb-1.5">
                Item Information
              </h3>

              <Input
                label="Item Name"
                value={itemForm.name}
                onChange={(e) => setItemForm({ ...itemForm, name: e.target.value })}
                required
                placeholder="e.g. Sony WH-1000XM5 Headphones"
              />

              <div className="flex gap-2 items-end">
                <div className="flex-1">
                  <Select
                    label="Category"
                    value={itemForm.categoryId}
                    onChange={(e) => setItemForm({ ...itemForm, categoryId: e.target.value })}
                    options={categories.map((c) => ({
                      value: c.id,
                      label: c.name
                    }))}
                    required
                  />
                </div>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => {
                    setIsItemModalOpen(false);
                    setActiveTab('categories');
                    handleOpenCategoryModal();
                  }}
                  title="Add new category"
                >
                  <PlusIcon className="h-4 w-4" />
                </Button>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  className="flex w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={2}
                  value={itemForm.description}
                  onChange={(e) => setItemForm({ ...itemForm, description: e.target.value })}
                  placeholder="Specification details, condition, notes..."
                />
              </div>

              {/* Rack Target and Slot Position */}
              <div className="space-y-3 pt-2 border-t border-gray-100">
                <Select
                  label="Target Rack"
                  value={itemForm.rackId || selectedRackId}
                  onChange={(e) => setItemForm({ ...itemForm, rackId: e.target.value })}
                  options={currentStoreRacks.map((r) => ({
                    value: r.id,
                    label: `${r.name} (${r.rows}x${r.cols})`
                  }))}
                  required
                />

                <div className="grid grid-cols-2 gap-3">
                  <Input
                    label="Row Position (0-indexed)"
                    type="number"
                    min="0"
                    max={
                      (currentStoreRacks.find((r) => r.id === (itemForm.rackId || selectedRackId))
                        ?.rows || 1) - 1
                    }
                    value={itemForm.row}
                    onChange={(e) =>
                      setItemForm({ ...itemForm, row: parseInt(e.target.value) || 0 })
                    }
                    required
                  />

                  <Input
                    label="Column Position (0-indexed)"
                    type="number"
                    min="0"
                    max={
                      (currentStoreRacks.find((r) => r.id === (itemForm.rackId || selectedRackId))
                        ?.cols || 1) - 1
                    }
                    value={itemForm.col}
                    onChange={(e) =>
                      setItemForm({ ...itemForm, col: parseInt(e.target.value) || 0 })
                    }
                    required
                  />
                </div>
                <p className="text-[11px] text-gray-500">
                  Multiple items can occupy the same slot (Row, Col) simultaneously.
                </p>
              </div>
            </div>

            {/* Custom Attributes Section */}
            <div className="space-y-4">
              <div className="flex justify-between items-center border-b pb-1.5">
                <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500">
                  Custom Attributes
                </h3>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={addAttribute}
                  className="h-7 text-xs text-blue-600"
                >
                  <PlusIcon className="h-3.5 w-3.5 mr-1" /> Add Field
                </Button>
              </div>

              {itemAttributes.length === 0 ? (
                <div className="text-center py-8 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                  <p className="text-xs text-gray-500">
                    No custom attributes added yet. Add custom fields like Brand, Color, Size, Serial Number, or Stock Quantity.
                  </p>
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={addAttribute}
                    className="mt-3 text-xs"
                  >
                    Add First Attribute
                  </Button>
                </div>
              ) : (
                <div className="space-y-2.5 max-h-[320px] overflow-y-auto pr-1">
                  {itemAttributes.map((attr, index) => (
                    <div key={index} className="flex gap-2 items-center">
                      <Input
                        placeholder="Key (e.g. Color)"
                        value={attr.key}
                        onChange={(e) => updateAttribute(index, 'key', e.target.value)}
                        required
                        className="text-xs h-9"
                      />
                      <Input
                        placeholder="Value (e.g. Midnight Black)"
                        value={attr.value}
                        onChange={(e) => updateAttribute(index, 'value', e.target.value)}
                        required
                        className="text-xs h-9"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="text-red-500 hover:text-red-700 hover:bg-red-50 p-2 shrink-0"
                        onClick={() => removeAttribute(index)}
                      >
                        <XIcon className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="pt-4 flex justify-end gap-3 border-t border-gray-200">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setIsItemModalOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit">
              {editingItem ? 'Save Item Changes' : 'Save Item to Rack'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* ========================================================================= */}
      {/* MODAL 3: CATEGORY CREATE / EDIT MODAL */}
      {/* ========================================================================= */}
      <Modal
        isOpen={isCategoryModalOpen}
        onClose={() => setIsCategoryModalOpen(false)}
        title={editingCategory ? 'Edit Category' : 'Add New Category'}
      >
        <form onSubmit={handleSaveCategory} className="space-y-4">
          <Input
            label="Category Name"
            value={categoryForm.name}
            onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })}
            required
            placeholder="e.g. Audio Equipment"
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              className="flex w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={3}
              value={categoryForm.description}
              onChange={(e) => setCategoryForm({ ...categoryForm, description: e.target.value })}
              placeholder="Headphones, speakers, microphones..."
            />
          </div>

          <div className="pt-4 flex justify-end gap-3 border-t border-gray-200">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setIsCategoryModalOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit">Save Category</Button>
          </div>
        </form>
      </Modal>

      {/* ========================================================================= */}
      {/* MODAL 4: RACK CREATE / EDIT MODAL */}
      {/* ========================================================================= */}
      <Modal
        isOpen={isRackModalOpen}
        onClose={() => setIsRackModalOpen(false)}
        title={editingRack ? `Edit Rack: ${editingRack.name}` : 'Add New Storage Rack'}
      >
        <form onSubmit={handleSaveRack} className="space-y-4">
          <Input
            label="Rack Name / Code"
            value={rackForm.name}
            onChange={(e) => setRackForm({ ...rackForm, name: e.target.value })}
            required
            placeholder="e.g. Rack B2 - Audio Hub"
          />

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Number of Rows"
              type="number"
              min="1"
              max="20"
              value={rackForm.rows}
              onChange={(e) =>
                setRackForm({ ...rackForm, rows: parseInt(e.target.value) || 1 })
              }
              required
            />

            <Input
              label="Number of Columns"
              type="number"
              min="1"
              max="20"
              value={rackForm.cols}
              onChange={(e) =>
                setRackForm({ ...rackForm, cols: parseInt(e.target.value) || 1 })
              }
              required
            />
          </div>

          <div className="p-3 bg-slate-50 rounded-lg text-xs text-gray-500 flex items-start gap-2">
            <InfoIcon className="h-4 w-4 text-blue-500 shrink-0 mt-0.5" />
            <span>
              Total slot capacity will be <strong>{rackForm.rows * rackForm.cols}</strong> slots. Each slot can hold multiple cataloged items.
            </span>
          </div>

          <div className="pt-4 flex justify-end gap-3 border-t border-gray-200">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setIsRackModalOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit">Save Rack</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};