import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { dbStores, dbCategories, dbRacks, dbItems } from '../lib/mockDb';
import { Store, Category, Rack, Item } from '../types';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { Modal } from '../components/ui/Modal';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell } from
'../components/ui/Table';
import {
  PlusIcon,
  EditIcon,
  TrashIcon,
  LayersIcon,
  TagsIcon,
  PackageIcon,
  GridIcon,
  ListIcon,
  XIcon } from
'lucide-react';
type Tab = 'items' | 'racks' | 'categories';
export const Inventory: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>('items');
  const [stores, setStores] = useState<Store[]>([]);
  const [selectedStoreId, setSelectedStoreId] = useState<string>('');
  // Data states
  const [categories, setCategories] = useState<Category[]>([]);
  const [racks, setRacks] = useState<Rack[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  // View states
  const [selectedRackId, setSelectedRackId] = useState<string>('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  // Modal states
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [isRackModalOpen, setIsRackModalOpen] = useState(false);
  const [isItemModalOpen, setIsItemModalOpen] = useState(false);
  // Form states
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [categoryForm, setCategoryForm] = useState({
    name: '',
    description: ''
  });
  const [editingRack, setEditingRack] = useState<Rack | null>(null);
  const [rackForm, setRackForm] = useState({
    name: '',
    rows: 5,
    cols: 5
  });
  const [editingItem, setEditingItem] = useState<Item | null>(null);
  const [itemForm, setItemForm] = useState({
    name: '',
    description: '',
    categoryId: '',
    row: 0,
    col: 0
  });
  const [itemAttributes, setItemAttributes] = useState<
    {
      key: string;
      value: string;
    }[]>(
    []);
  // Load initial data
  useEffect(() => {
    const allStores = dbStores.getAll();
    let availableStores = allStores;
    if (user?.role === 'user') {
      availableStores = allStores.filter((s) =>
      user.assignedStores?.includes(s.id)
      );
    }
    setStores(availableStores);
    if (availableStores.length > 0 && !selectedStoreId) {
      setSelectedStoreId(availableStores[0].id);
    }
    loadCategories();
  }, [user]);
  // Load dependent data when store changes
  useEffect(() => {
    if (selectedStoreId) {
      loadRacks();
    } else {
      setRacks([]);
      setItems([]);
    }
  }, [selectedStoreId]);
  // Load items when rack changes
  useEffect(() => {
    if (selectedRackId) {
      loadItems();
    } else {
      setItems([]);
    }
  }, [selectedRackId]);
  const loadCategories = () => setCategories(dbCategories.getAll());
  const loadRacks = () => {
    const storeRacks = dbRacks.getByStoreId(selectedStoreId);
    setRacks(storeRacks);
    if (
    storeRacks.length > 0 &&
    !storeRacks.find((r) => r.id === selectedRackId))
    {
      setSelectedRackId(storeRacks[0].id);
    } else if (storeRacks.length === 0) {
      setSelectedRackId('');
    }
  };
  const loadItems = () => setItems(dbItems.getByRackId(selectedRackId));
  // --- Category Handlers ---
  const handleOpenCategoryModal = (category?: Category) => {
    if (category) {
      setEditingCategory(category);
      setCategoryForm({
        name: category.name,
        description: category.description
      });
    } else {
      setEditingCategory(null);
      setCategoryForm({
        name: '',
        description: ''
      });
    }
    setIsCategoryModalOpen(true);
  };
  const handleSaveCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingCategory) {
      dbCategories.update(editingCategory.id, categoryForm);
    } else {
      dbCategories.create(categoryForm);
    }
    loadCategories();
    setIsCategoryModalOpen(false);
  };
  const handleDeleteCategory = (id: string) => {
    if (window.confirm('Delete this category?')) {
      dbCategories.delete(id);
      loadCategories();
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
        rows: 5,
        cols: 5
      });
    }
    setIsRackModalOpen(true);
  };
  const handleSaveRack = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingRack) {
      dbRacks.update(editingRack.id, rackForm);
    } else {
      dbRacks.create({
        ...rackForm,
        storeId: selectedStoreId
      });
    }
    loadRacks();
    setIsRackModalOpen(false);
  };
  const handleDeleteRack = (id: string) => {
    if (window.confirm('Delete this rack and all its items?')) {
      dbRacks.delete(id);
      // Also delete items in this rack
      const rackItems = dbItems.getByRackId(id);
      rackItems.forEach((item) => dbItems.delete(item.id));
      loadRacks();
      if (selectedRackId === id) setSelectedRackId('');
    }
  };
  // --- Item Handlers ---
  const handleOpenItemModal = (
  item?: Item,
  row: number = 0,
  col: number = 0) =>
  {
    if (item) {
      setEditingItem(item);
      setItemForm({
        name: item.name,
        description: item.description,
        categoryId: item.categoryId,
        row: item.row,
        col: item.col
      });
      setItemAttributes(
        Object.entries(item.attributes || {}).map(([key, value]) => ({
          key,
          value
        }))
      );
    } else {
      setEditingItem(null);
      setItemForm({
        name: '',
        description: '',
        categoryId: categories.length > 0 ? categories[0].id : '',
        row,
        col
      });
      setItemAttributes([]);
    }
    setIsItemModalOpen(true);
  };
  const handleSaveItem = (e: React.FormEvent) => {
    e.preventDefault();
    // Convert attributes array to Record
    const attributesRecord: Record<string, string> = {};
    itemAttributes.forEach((attr) => {
      if (attr.key.trim()) attributesRecord[attr.key.trim()] = attr.value;
    });
    const itemData = {
      ...itemForm,
      attributes: attributesRecord,
      rackId: selectedRackId,
      storeId: selectedStoreId
    };
    if (editingItem) {
      dbItems.update(editingItem.id, itemData);
    } else {
      dbItems.create(itemData);
    }
    loadItems();
    setIsItemModalOpen(false);
  };
  const handleDeleteItem = (id: string) => {
    if (window.confirm('Delete this item?')) {
      dbItems.delete(id);
      loadItems();
    }
  };
  const addAttribute = () =>
  setItemAttributes([
  ...itemAttributes,
  {
    key: '',
    value: ''
  }]
  );
  const updateAttribute = (
  index: number,
  field: 'key' | 'value',
  val: string) =>
  {
    const newAttrs = [...itemAttributes];
    newAttrs[index][field] = val;
    setItemAttributes(newAttrs);
  };
  const removeAttribute = (index: number) => {
    setItemAttributes(itemAttributes.filter((_, i) => i !== index));
  };
  // --- Render Helpers ---
  const renderGrid = () => {
    const rack = racks.find((r) => r.id === selectedRackId);
    if (!rack)
    return (
      <div className="text-center py-8 text-gray-500">
          Select a rack to view its grid.
        </div>);

    const grid = [];
    for (let r = 0; r < rack.rows; r++) {
      const rowCells = [];
      for (let c = 0; c < rack.cols; c++) {
        const item = items.find((i) => i.row === r && i.col === c);
        rowCells.push(
          <div
            key={`${r}-${c}`}
            className={`border rounded-md p-2 min-h-[100px] flex flex-col items-center justify-center cursor-pointer transition-colors ${item ? 'bg-blue-50 border-blue-200 hover:bg-blue-100' : 'bg-gray-50 border-dashed border-gray-300 hover:bg-gray-100'}`}
            onClick={() => handleOpenItemModal(item, r, c)}>

            {item ?
            <>
                <PackageIcon className="h-6 w-6 text-blue-600 mb-1" />
                <span
                className="text-xs font-medium text-center line-clamp-2"
                title={item.name}>

                  {item.name}
                </span>
                <span className="text-[10px] text-gray-500 mt-1">
                  {categories.find((cat) => cat.id === item.categoryId)?.name ||
                'Uncategorized'}
                </span>
              </> :

            <span className="text-xs text-gray-400">
                Empty Slot
                <br />({r},{c})
              </span>
            }
          </div>
        );
      }
      grid.push(
        <div key={r} className="flex gap-2 mb-2">
          {rowCells}
        </div>
      );
    }
    return (
      <div className="overflow-auto p-4 bg-white border border-gray-200 rounded-lg shadow-inner">
        <div className="inline-flex flex-col min-w-max">{grid}</div>
      </div>);

  };
  if (stores.length === 0) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-gray-900">
          No Stores Available
        </h2>
        <p className="text-gray-500 mt-2">
          You need to be assigned to a store to manage inventory.
        </p>
      </div>);

  }
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Inventory Management
          </h1>
          <p className="text-gray-500">Manage categories, racks, and items</p>
        </div>

        <div className="flex items-center gap-2 bg-white p-1 rounded-lg border border-gray-200 shadow-sm">
          <Select
            value={selectedStoreId}
            onChange={(e) => setSelectedStoreId(e.target.value)}
            options={stores.map((s) => ({
              value: s.id,
              label: s.name
            }))}
            className="border-none shadow-none focus:ring-0 w-48" />

        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200">
        <button
          className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'items' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
          onClick={() => setActiveTab('items')}>

          <PackageIcon className="h-4 w-4" /> Items
        </button>
        <button
          className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'racks' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
          onClick={() => setActiveTab('racks')}>

          <LayersIcon className="h-4 w-4" /> Racks
        </button>
        <button
          className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'categories' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
          onClick={() => setActiveTab('categories')}>

          <TagsIcon className="h-4 w-4" /> Categories
        </button>
      </div>

      {/* Content based on active tab */}
      <div className="mt-6">
        {/* CATEGORIES TAB */}
        {activeTab === 'categories' &&
        <div className="space-y-4">
            <div className="flex justify-end">
              <Button
              onClick={() => handleOpenCategoryModal()}
              className="flex items-center gap-2">

                <PlusIcon className="h-4 w-4" /> Add Category
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {categories.map((cat) =>
            <Card key={cat.id}>
                  <CardContent className="p-4 flex justify-between items-start">
                    <div>
                      <h3 className="font-semibold text-gray-900">
                        {cat.name}
                      </h3>
                      <p className="text-sm text-gray-500 mt-1">
                        {cat.description}
                      </p>
                    </div>
                    <div className="flex gap-1">
                      <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleOpenCategoryModal(cat)}>

                        <EditIcon className="h-4 w-4 text-blue-600" />
                      </Button>
                      <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteCategory(cat.id)}>

                        <TrashIcon className="h-4 w-4 text-red-600" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
            )}
              {categories.length === 0 &&
            <div className="col-span-full text-center py-8 text-gray-500 bg-white rounded-lg border border-dashed">
                  No categories found. Create one to get started.
                </div>
            }
            </div>
          </div>
        }

        {/* RACKS TAB */}
        {activeTab === 'racks' &&
        <div className="space-y-4">
            <div className="flex justify-end">
              <Button
              onClick={() => handleOpenRackModal()}
              className="flex items-center gap-2">

                <PlusIcon className="h-4 w-4" /> Add Rack
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {racks.map((rack) =>
            <Card key={rack.id}>
                  <CardContent className="p-4 flex justify-between items-start">
                    <div>
                      <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                        <LayersIcon className="h-4 w-4 text-purple-600" />
                        {rack.name}
                      </h3>
                      <p className="text-sm text-gray-500 mt-1">
                        Dimensions: {rack.rows} rows × {rack.cols} cols
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        Capacity: {rack.rows * rack.cols} slots
                      </p>
                    </div>
                    <div className="flex gap-1">
                      <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleOpenRackModal(rack)}>

                        <EditIcon className="h-4 w-4 text-blue-600" />
                      </Button>
                      <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteRack(rack.id)}>

                        <TrashIcon className="h-4 w-4 text-red-600" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
            )}
              {racks.length === 0 &&
            <div className="col-span-full text-center py-8 text-gray-500 bg-white rounded-lg border border-dashed">
                  No racks found for this store. Create one to start adding
                  items.
                </div>
            }
            </div>
          </div>
        }

        {/* ITEMS TAB */}
        {activeTab === 'items' &&
        <div className="space-y-4">
            {racks.length === 0 ?
          <div className="text-center py-12 bg-white rounded-lg border border-dashed">
                <LayersIcon className="mx-auto h-12 w-12 text-gray-300 mb-4" />
                <h3 className="text-lg font-medium text-gray-900">
                  No Racks Available
                </h3>
                <p className="text-gray-500 mt-1">
                  You need to create a rack before adding items.
                </p>
                <Button
              onClick={() => setActiveTab('racks')}
              className="mt-4"
              variant="secondary">

                  Go to Racks
                </Button>
              </div> :

          <>
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                  <div className="flex items-center gap-4 w-full sm:w-auto">
                    <Select
                  label="Select Rack"
                  value={selectedRackId}
                  onChange={(e) => setSelectedRackId(e.target.value)}
                  options={racks.map((r) => ({
                    value: r.id,
                    label: r.name
                  }))}
                  className="w-full sm:w-64" />

                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-auto">
                    <div className="flex bg-gray-100 p-1 rounded-md">
                      <button
                    onClick={() => setViewMode('grid')}
                    className={`p-1.5 rounded ${viewMode === 'grid' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
                    title="Grid View">

                        <GridIcon className="h-4 w-4" />
                      </button>
                      <button
                    onClick={() => setViewMode('list')}
                    className={`p-1.5 rounded ${viewMode === 'list' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
                    title="List View">

                        <ListIcon className="h-4 w-4" />
                      </button>
                    </div>
                    <Button
                  onClick={() => handleOpenItemModal()}
                  className="flex items-center gap-2">

                      <PlusIcon className="h-4 w-4" /> Add Item
                    </Button>
                  </div>
                </div>

                {viewMode === 'grid' ?
            renderGrid() :

            <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Item Name</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead>Location (Row, Col)</TableHead>
                        <TableHead>Attributes</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {items.length === 0 ?
                <TableRow>
                          <TableCell
                    colSpan={5}
                    className="text-center py-8 text-gray-500">

                            No items found in this rack.
                          </TableCell>
                        </TableRow> :

                items.map((item) =>
                <TableRow key={item.id}>
                            <TableCell className="font-medium text-gray-900">
                              {item.name}
                              <div className="text-xs text-gray-500 font-normal">
                                {item.description}
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant="info">
                                {categories.find(
                        (c) => c.id === item.categoryId
                      )?.name || 'Unknown'}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Badge variant="default">
                                Row {item.row}, Col {item.col}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="flex flex-wrap gap-1">
                                {Object.entries(item.attributes || {}).map(
                        ([k, v]) =>
                        <span
                          key={k}
                          className="text-xs bg-gray-100 px-2 py-1 rounded text-gray-600">

                                      <span className="font-medium">{k}:</span>{' '}
                                      {v}
                                    </span>

                      )}
                              </div>
                            </TableCell>
                            <TableCell className="text-right">
                              <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleOpenItemModal(item)}>

                                <EditIcon className="h-4 w-4 text-blue-600" />
                              </Button>
                              <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteItem(item.id)}>

                                <TrashIcon className="h-4 w-4 text-red-600" />
                              </Button>
                            </TableCell>
                          </TableRow>
                )
                }
                    </TableBody>
                  </Table>
            }
              </>
          }
          </div>
        }
      </div>

      {/* MODALS */}

      {/* Category Modal */}
      <Modal
        isOpen={isCategoryModalOpen}
        onClose={() => setIsCategoryModalOpen(false)}
        title={editingCategory ? 'Edit Category' : 'Add Category'}>

        <form onSubmit={handleSaveCategory} className="space-y-4">
          <Input
            label="Category Name"
            value={categoryForm.name}
            onChange={(e) =>
            setCategoryForm({
              ...categoryForm,
              name: e.target.value
            })
            }
            required />

          <div className="w-full">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              className="flex w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={3}
              value={categoryForm.description}
              onChange={(e) =>
              setCategoryForm({
                ...categoryForm,
                description: e.target.value
              })
              } />

          </div>
          <div className="pt-4 flex justify-end gap-3 border-t border-gray-200">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setIsCategoryModalOpen(false)}>

              Cancel
            </Button>
            <Button type="submit">Save</Button>
          </div>
        </form>
      </Modal>

      {/* Rack Modal */}
      <Modal
        isOpen={isRackModalOpen}
        onClose={() => setIsRackModalOpen(false)}
        title={editingRack ? 'Edit Rack' : 'Add Rack'}>

        <form onSubmit={handleSaveRack} className="space-y-4">
          <Input
            label="Rack Name / Identifier"
            value={rackForm.name}
            onChange={(e) =>
            setRackForm({
              ...rackForm,
              name: e.target.value
            })
            }
            required
            placeholder="e.g., A1, Front Display, Warehouse Rack 3" />

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Number of Rows"
              type="number"
              min="1"
              max="20"
              value={rackForm.rows}
              onChange={(e) =>
              setRackForm({
                ...rackForm,
                rows: parseInt(e.target.value) || 1
              })
              }
              required />

            <Input
              label="Number of Columns"
              type="number"
              min="1"
              max="20"
              value={rackForm.cols}
              onChange={(e) =>
              setRackForm({
                ...rackForm,
                cols: parseInt(e.target.value) || 1
              })
              }
              required />

          </div>
          <p className="text-xs text-gray-500">
            Warning: Reducing dimensions on an existing rack may hide items
            placed outside the new bounds.
          </p>
          <div className="pt-4 flex justify-end gap-3 border-t border-gray-200">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setIsRackModalOpen(false)}>

              Cancel
            </Button>
            <Button type="submit">Save</Button>
          </div>
        </form>
      </Modal>

      {/* Item Modal */}
      <Modal
        isOpen={isItemModalOpen}
        onClose={() => setIsItemModalOpen(false)}
        title={editingItem ? 'Edit Item' : 'Add Item'}
        maxWidth="2xl">

        <form onSubmit={handleSaveItem} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-gray-900 border-b pb-2">
                Basic Details
              </h3>
              <Input
                label="Item Name"
                value={itemForm.name}
                onChange={(e) =>
                setItemForm({
                  ...itemForm,
                  name: e.target.value
                })
                }
                required />


              <div className="flex gap-2 items-end">
                <div className="flex-1">
                  <Select
                    label="Category"
                    value={itemForm.categoryId}
                    onChange={(e) =>
                    setItemForm({
                      ...itemForm,
                      categoryId: e.target.value
                    })
                    }
                    options={categories.map((c) => ({
                      value: c.id,
                      label: c.name
                    }))}
                    required />

                </div>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => {
                    setIsItemModalOpen(false);
                    setActiveTab('categories');
                    handleOpenCategoryModal();
                  }}
                  title="Add new category">

                  <PlusIcon className="h-4 w-4" />
                </Button>
              </div>

              <div className="w-full">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  className="flex w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={2}
                  value={itemForm.description}
                  onChange={(e) =>
                  setItemForm({
                    ...itemForm,
                    description: e.target.value
                  })
                  } />

              </div>

              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Row Position"
                  type="number"
                  min="0"
                  max={
                  (racks.find((r) => r.id === selectedRackId)?.rows || 1) - 1
                  }
                  value={itemForm.row}
                  onChange={(e) =>
                  setItemForm({
                    ...itemForm,
                    row: parseInt(e.target.value) || 0
                  })
                  }
                  required />

                <Input
                  label="Column Position"
                  type="number"
                  min="0"
                  max={
                  (racks.find((r) => r.id === selectedRackId)?.cols || 1) - 1
                  }
                  value={itemForm.col}
                  onChange={(e) =>
                  setItemForm({
                    ...itemForm,
                    col: parseInt(e.target.value) || 0
                  })
                  }
                  required />

              </div>
            </div>

            <div className="space-y-4">
              <div className="flex justify-between items-center border-b pb-2">
                <h3 className="text-sm font-medium text-gray-900">
                  Dynamic Attributes
                </h3>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={addAttribute}
                  className="h-8 text-blue-600">

                  <PlusIcon className="h-4 w-4 mr-1" /> Add Field
                </Button>
              </div>

              {itemAttributes.length === 0 ?
              <p className="text-sm text-gray-500 italic">
                  No custom attributes added. Add fields like Color, Size, or
                  Serial Number.
                </p> :

              <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2">
                  {itemAttributes.map((attr, index) =>
                <div key={index} className="flex gap-2 items-start">
                      <div className="flex-1 space-y-2">
                        <Input
                      placeholder="Key (e.g. Color)"
                      value={attr.key}
                      onChange={(e) =>
                      updateAttribute(index, 'key', e.target.value)
                      }
                      required />

                        <Input
                      placeholder="Value (e.g. Red)"
                      value={attr.value}
                      onChange={(e) =>
                      updateAttribute(index, 'value', e.target.value)
                      }
                      required />

                      </div>
                      <Button
                    type="button"
                    variant="ghost"
                    className="text-red-500 hover:text-red-700 hover:bg-red-50 mt-1"
                    onClick={() => removeAttribute(index)}>

                        <XIcon className="h-4 w-4" />
                      </Button>
                    </div>
                )}
                </div>
              }
            </div>
          </div>

          <div className="pt-4 flex justify-end gap-3 border-t border-gray-200">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setIsItemModalOpen(false)}>

              Cancel
            </Button>
            <Button type="submit">Save Item</Button>
          </div>
        </form>
      </Modal>
    </div>);

};