import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { motion, AnimatePresence } from 'framer-motion';
import { FaPlus, FaEdit, FaTrash, FaImage, FaSave, FaTimes, FaEye, FaEyeSlash, FaStar } from 'react-icons/fa';
import { toast } from 'react-toastify';
import { useVendorAuth } from '../contexts/VendorAuthContext';
import { MenuItem } from '../types/index';
import supabase from '../services/supabaseClient';

const Container = styled.div`
  background: white;
  border-radius: 15px;
  padding: 25px;
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.08);
  margin: 20px 0;
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 25px;
  flex-wrap: wrap;
  gap: 15px;
`;

const Title = styled.h2`
  color: #2c3e50;
  margin: 0;
  font-size: 1.5rem;
  font-weight: 700;
`;

const AddButton = styled.button`
  background: linear-gradient(135deg, #28a745 0%, #20c997 100%);
  color: white;
  border: none;
  padding: 12px 20px;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 8px;
  transition: all 0.3s ease;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 5px 15px rgba(40, 167, 69, 0.3);
  }
`;

const CategoryTabs = styled.div`
  display: flex;
  gap: 10px;
  margin-bottom: 25px;
  flex-wrap: wrap;
`;

const CategoryTab = styled.button<{ $active: boolean }>`
  background: ${(props: { $active: boolean }) => props.$active ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' : '#f8f9fa'};
  color: ${(props: { $active: boolean }) => props.$active ? 'white' : '#666'};
  border: none;
  padding: 10px 20px;
  border-radius: 25px;
  cursor: pointer;
  font-weight: 600;
  transition: all 0.3s ease;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 3px 10px rgba(0, 0, 0, 0.1);
  }
`;

const MenuGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 20px;
`;

const MenuItemCard = styled(motion.div)`
  background: #f8f9fa;
  border: 2px solid #e9ecef;
  border-radius: 12px;
  overflow: hidden;
  transition: all 0.3s ease;
  
  &:hover {
    border-color: #667eea;
    box-shadow: 0 5px 15px rgba(102, 126, 234, 0.1);
  }
`;

const ItemImage = styled.div<{ $imageUrl?: string }>`
  width: 100%;
  height: 150px;
  background: ${(props: { $imageUrl?: string }) =>
    props.$imageUrl
      ? `url(${props.$imageUrl})`
      : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
  };
  background-size: cover;
  background-position: center;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const ImagePlaceholder = styled.div`
  color: white;
  font-size: 2rem;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.5);
`;

const ItemContent = styled.div`
  padding: 15px;
`;

const ItemHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 10px;
`;

const ItemName = styled.h4`
  color: #2c3e50;
  margin: 0;
  font-size: 1.1rem;
  font-weight: 700;
  flex: 1;
`;

const ItemPrice = styled.div`
  color: #27ae60;
  font-size: 1.2rem;
  font-weight: 700;
`;

const ItemDescription = styled.p`
  color: #666;
  font-size: 0.9rem;
  margin: 8px 0;
  line-height: 1.4;
`;

const ItemMeta = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin: 10px 0;
  font-size: 0.85rem;
  color: #666;
`;

const ItemActions = styled.div`
  display: flex;
  gap: 8px;
  margin-top: 15px;
`;

const ActionButton = styled.button<{ $variant?: 'primary' | 'danger' | 'secondary' }>`
  background: ${(props: { $variant?: 'primary' | 'danger' | 'secondary' }) => {
    switch (props.$variant) {
      case 'danger': return 'linear-gradient(135deg, #dc3545 0%, #c82333 100%)';
      case 'secondary': return '#6c757d';
      default: return 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
    }
  }};
  color: white;
  border: none;
  padding: 8px 12px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.85rem;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 5px;
  transition: all 0.3s ease;
  flex: 1;
  justify-content: center;

  &:hover {
    transform: translateY(-1px);
    box-shadow: 0 3px 8px rgba(0, 0, 0, 0.2);
  }
`;

const StatusBadge = styled.div<{ $available: boolean }>`
  position: absolute;
  top: 10px;
  right: 10px;
  background: ${(props: { $available: boolean }) => props.$available ? '#28a745' : '#dc3545'};
  color: white;
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 0.7rem;
  font-weight: 600;
  text-transform: uppercase;
`;

const FeaturedBadge = styled.div`
  position: absolute;
  top: 10px;
  left: 10px;
  background: linear-gradient(135deg, #ffc107 0%, #ff8c00 100%);
  color: white;
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 0.7rem;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 3px;
`;

const Modal = styled(motion.div)`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 20px;
`;

const ModalContent = styled(motion.div)`
  background: white;
  border-radius: 15px;
  padding: 25px;
  max-width: 500px;
  width: 100%;
  max-height: 90vh;
  overflow-y: auto;
`;

const ModalHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
`;

const ModalTitle = styled.h3`
  color: #2c3e50;
  margin: 0;
  font-size: 1.3rem;
  font-weight: 700;
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  color: #666;
  font-size: 1.2rem;
  cursor: pointer;
  padding: 5px;
  
  &:hover {
    color: #dc3545;
  }
`;

const FormGroup = styled.div`
  margin-bottom: 20px;
`;

const Label = styled.label`
  display: block;
  color: #2c3e50;
  font-weight: 600;
  margin-bottom: 8px;
`;

const Input = styled.input`
  width: 100%;
  padding: 12px;
  border: 2px solid #e9ecef;
  border-radius: 8px;
  font-size: 1rem;
  transition: border-color 0.3s ease;
  
  &:focus {
    outline: none;
    border-color: #667eea;
  }
`;

const TextArea = styled.textarea`
  width: 100%;
  padding: 12px;
  border: 2px solid #e9ecef;
  border-radius: 8px;
  font-size: 1rem;
  min-height: 80px;
  resize: vertical;
  transition: border-color 0.3s ease;
  
  &:focus {
    outline: none;
    border-color: #667eea;
  }
`;

const Select = styled.select`
  width: 100%;
  padding: 12px;
  border: 2px solid #e9ecef;
  border-radius: 8px;
  font-size: 1rem;
  background: white;
  transition: border-color 0.3s ease;
  
  &:focus {
    outline: none;
    border-color: #667eea;
  }
`;

const CheckboxGroup = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  margin-top: 10px;
`;

const Checkbox = styled.input`
  width: 18px;
  height: 18px;
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 10px;
  margin-top: 25px;
`;

const SaveButton = styled.button`
  background: linear-gradient(135deg, #28a745 0%, #20c997 100%);
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1;
  justify-content: center;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 5px 15px rgba(40, 167, 69, 0.3);
  }
  
  &:disabled {
    background: #6c757d;
    cursor: not-allowed;
    transform: none;
    box-shadow: none;
  }
`;

const CancelButton = styled.button`
  background: #6c757d;
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1;
  justify-content: center;
  
  &:hover {
    background: #5a6268;
  }
`;

interface MenuCategory {
  id: string;
  name: string;
  description?: string;
  display_order: number;
  is_active: boolean;
}

interface MenuItemFormData {
  name: string;
  description: string;
  price: number;
  category_id: string;
  preparation_time: number;
  is_available: boolean;
  is_featured: boolean;
  inventory_count: number;
  low_stock_threshold: number;
  tags: string;
  ingredients: string;
  image_url: string;
}

const VendorMenuManager: React.FC = () => {
  const { vendor } = useVendorAuth();
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [categories, setCategories] = useState<MenuCategory[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);

  // Debug vendor information
  console.log('VendorMenuManager - Current vendor:', vendor);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState<MenuItemFormData>({
    name: '',
    description: '',
    price: 0,
    category_id: '',
    preparation_time: 15,
    is_available: true,
    is_featured: false,
    inventory_count: -1,
    low_stock_threshold: 5,
    tags: '',
    ingredients: '',
    image_url: ''
  });

  useEffect(() => {
    if (vendor) {
      loadMenuData();
    }
  }, [vendor]);

  const loadMenuData = async () => {
    if (!vendor) return;
    
    setLoading(true);
    try {
      // Load categories
      const { data: categoriesData, error: categoriesError } = await supabase
        .from('menu_categories')
        .select('*')
        .eq('vendor_id', vendor.id)
        .eq('is_active', true)
        .order('display_order');

      if (categoriesError) throw categoriesError;
      setCategories(categoriesData || []);

      // Load menu items
      const { data: itemsData, error: itemsError } = await supabase
        .from('menu_items')
        .select('*')
        .eq('vendor_id', vendor.id)
        .order('name');

      if (itemsError) throw itemsError;
      setMenuItems(itemsData || []);
    } catch (error: any) {
      console.error('Error loading menu data:', error);
      toast.error('Failed to load menu data');
    } finally {
      setLoading(false);
    }
  };

  const handleAddItem = () => {
    setEditingItem(null);
    setFormData({
      name: '',
      description: '',
      price: 0,
      category_id: categories.length > 0 ? categories[0].id : '',
      preparation_time: 15,
      is_available: true,
      is_featured: false,
      inventory_count: -1,
      low_stock_threshold: 5,
      tags: '',
      ingredients: '',
      image_url: ''
    });
    setShowModal(true);
  };

  const handleEditItem = (item: MenuItem) => {
    setEditingItem(item);
    setFormData({
      name: item.name,
      description: item.description,
      price: item.price,
      category_id: item.category_id || '',
      preparation_time: item.preparation_time || 15,
      is_available: item.is_available,
      is_featured: item.is_featured || false,
      inventory_count: item.inventory_count || -1,
      low_stock_threshold: item.low_stock_threshold || 5,
      tags: Array.isArray(item.tags) ? item.tags.join(', ') : '',
      ingredients: Array.isArray(item.ingredients) ? item.ingredients.join(', ') : '',
      image_url: item.image_url || ''
    });
    setShowModal(true);
  };

  const handleSaveItem = async () => {
    if (!vendor || !formData.name.trim()) {
      toast.error('Please fill in all required fields');
      return;
    }

    setSaving(true);
    try {
      const itemData = {
        name: formData.name.trim(),
        description: formData.description.trim(),
        price: formData.price,
        category_id: formData.category_id || null,
        preparation_time: formData.preparation_time,
        is_available: formData.is_available,
        is_featured: formData.is_featured,
        inventory_count: formData.inventory_count,
        low_stock_threshold: formData.low_stock_threshold,
        tags: formData.tags ? formData.tags.split(',').map(tag => tag.trim()) : [],
        ingredients: formData.ingredients ? formData.ingredients.split(',').map(ing => ing.trim()) : [],
        image_url: formData.image_url.trim(),
        vendor_id: vendor.id,
        category: categories.find(cat => cat.id === formData.category_id)?.name || 'Other'
      };

      if (editingItem) {
        // Update existing item
        const { error } = await supabase
          .from('menu_items')
          .update(itemData)
          .eq('id', editingItem.id);

        if (error) throw error;
        toast.success('Menu item updated successfully!');
      } else {
        // Create new item
        const { error } = await supabase
          .from('menu_items')
          .insert([itemData]);

        if (error) throw error;
        toast.success('Menu item added successfully!');
      }

      setShowModal(false);
      loadMenuData();
    } catch (error: any) {
      console.error('Error saving menu item:', error);
      toast.error('Failed to save menu item');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteItem = async (item: MenuItem) => {
    if (!window.confirm(`Are you sure you want to delete "${item.name}"?`)) {
      return;
    }

    try {
      const { error } = await supabase
        .from('menu_items')
        .delete()
        .eq('id', item.id);

      if (error) throw error;
      
      toast.success('Menu item deleted successfully!');
      loadMenuData();
    } catch (error: any) {
      console.error('Error deleting menu item:', error);
      toast.error('Failed to delete menu item');
    }
  };

  const toggleItemAvailability = async (item: MenuItem) => {
    try {
      const { error } = await supabase
        .from('menu_items')
        .update({ is_available: !item.is_available })
        .eq('id', item.id);

      if (error) throw error;
      
      toast.success(`${item.name} is now ${!item.is_available ? 'available' : 'unavailable'}`);
      loadMenuData();
    } catch (error: any) {
      console.error('Error updating item availability:', error);
      toast.error('Failed to update item availability');
    }
  };

  const filteredItems = selectedCategory === 'all' 
    ? menuItems 
    : menuItems.filter(item => item.category_id === selectedCategory);

  if (!vendor) {
    return <div>Please log in to manage your menu.</div>;
  }

  return (
    <Container>
      <Header>
        <Title>🍽️ Menu Management</Title>
        <AddButton onClick={handleAddItem}>
          <FaPlus />
          Add New Item
        </AddButton>
      </Header>

      <CategoryTabs>
        <CategoryTab
          $active={selectedCategory === 'all'}
          onClick={() => setSelectedCategory('all')}
        >
          All Items ({menuItems.length})
        </CategoryTab>
        {categories.map(category => (
          <CategoryTab
            key={category.id}
            $active={selectedCategory === category.id}
            onClick={() => setSelectedCategory(category.id)}
          >
            {category.name} ({menuItems.filter(item => item.category_id === category.id).length})
          </CategoryTab>
        ))}
      </CategoryTabs>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
          Loading menu items...
        </div>
      ) : (
        <MenuGrid>
          {filteredItems.map((item) => (
            <MenuItemCard
              key={item.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <ItemImage $imageUrl={item.image_url}>
                {!item.image_url && (
                  <ImagePlaceholder>
                    <FaImage />
                  </ImagePlaceholder>
                )}
                <StatusBadge $available={item.is_available}>
                  {item.is_available ? 'Available' : 'Out of Stock'}
                </StatusBadge>
                {item.is_featured && (
                  <FeaturedBadge>
                    <FaStar size={10} />
                    Featured
                  </FeaturedBadge>
                )}
              </ItemImage>
              
              <ItemContent>
                <ItemHeader>
                  <ItemName>{item.name}</ItemName>
                  <ItemPrice>₹{item.price.toFixed(2)}</ItemPrice>
                </ItemHeader>
                
                <ItemDescription>{item.description}</ItemDescription>
                
                <ItemMeta>
                  <span>⏱️ {item.preparation_time || 15} mins</span>
                  <span>📦 Stock: {item.inventory_count === -1 ? '∞' : item.inventory_count}</span>
                </ItemMeta>
                
                <ItemActions>
                  <ActionButton onClick={() => handleEditItem(item)}>
                    <FaEdit />
                    Edit
                  </ActionButton>
                  <ActionButton
                    $variant="secondary"
                    onClick={() => toggleItemAvailability(item)}
                  >
                    {item.is_available ? <FaEyeSlash /> : <FaEye />}
                    {item.is_available ? 'Hide' : 'Show'}
                  </ActionButton>
                  <ActionButton
                    $variant="danger"
                    onClick={() => handleDeleteItem(item)}
                  >
                    <FaTrash />
                    Delete
                  </ActionButton>
                </ItemActions>
              </ItemContent>
            </MenuItemCard>
          ))}
        </MenuGrid>
      )}

      <AnimatePresence>
        {showModal && (
          <Modal
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={(e: React.MouseEvent) => e.target === e.currentTarget && setShowModal(false)}
          >
            <ModalContent
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
            >
              <ModalHeader>
                <ModalTitle>
                  {editingItem ? 'Edit Menu Item' : 'Add New Menu Item'}
                </ModalTitle>
                <CloseButton onClick={() => setShowModal(false)}>
                  <FaTimes />
                </CloseButton>
              </ModalHeader>

              <FormGroup>
                <Label>Item Name *</Label>
                <Input
                  type="text"
                  value={formData.name}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Enter item name"
                />
              </FormGroup>

              <FormGroup>
                <Label>Description</Label>
                <TextArea
                  value={formData.description}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Describe your item"
                />
              </FormGroup>

              <FormGroup>
                <Label>Price (₹) *</Label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.price}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
                  placeholder="0.00"
                />
              </FormGroup>

              <FormGroup>
                <Label>Category</Label>
                <Select
                  value={formData.category_id}
                  onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setFormData({ ...formData, category_id: e.target.value })}
                >
                  <option value="">Select Category</option>
                  {categories.map(category => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </Select>
              </FormGroup>

              <FormGroup>
                <Label>Preparation Time (minutes)</Label>
                <Input
                  type="number"
                  min="1"
                  value={formData.preparation_time}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, preparation_time: parseInt(e.target.value) || 15 })}
                />
              </FormGroup>

              <FormGroup>
                <Label>Image URL</Label>
                <Input
                  type="url"
                  value={formData.image_url}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, image_url: e.target.value })}
                  placeholder="https://example.com/image.jpg"
                />
              </FormGroup>

              <FormGroup>
                <Label>Inventory Count (-1 for unlimited)</Label>
                <Input
                  type="number"
                  min="-1"
                  value={formData.inventory_count}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, inventory_count: parseInt(e.target.value) || -1 })}
                />
              </FormGroup>

              <FormGroup>
                <Label>Tags (comma-separated)</Label>
                <Input
                  type="text"
                  value={formData.tags}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, tags: e.target.value })}
                  placeholder="spicy, vegetarian, popular"
                />
              </FormGroup>

              <FormGroup>
                <Label>Ingredients (comma-separated)</Label>
                <Input
                  type="text"
                  value={formData.ingredients}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, ingredients: e.target.value })}
                  placeholder="chicken, tomatoes, spices"
                />
              </FormGroup>

              <CheckboxGroup>
                <Checkbox
                  type="checkbox"
                  checked={formData.is_available}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, is_available: e.target.checked })}
                />
                <Label>Available for orders</Label>
              </CheckboxGroup>

              <CheckboxGroup>
                <Checkbox
                  type="checkbox"
                  checked={formData.is_featured}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, is_featured: e.target.checked })}
                />
                <Label>Featured item</Label>
              </CheckboxGroup>

              <ButtonGroup>
                <SaveButton onClick={handleSaveItem} disabled={saving}>
                  <FaSave />
                  {saving ? 'Saving...' : 'Save Item'}
                </SaveButton>
                <CancelButton onClick={() => setShowModal(false)}>
                  <FaTimes />
                  Cancel
                </CancelButton>
              </ButtonGroup>
            </ModalContent>
          </Modal>
        )}
      </AnimatePresence>
    </Container>
  );
};

export default VendorMenuManager;
