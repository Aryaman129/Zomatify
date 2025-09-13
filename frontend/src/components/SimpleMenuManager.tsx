import React, { useState, useCallback } from 'react';
import styled from 'styled-components';
import { FaPlus, FaEdit, FaTrash, FaImage, FaEye, FaEyeSlash } from 'react-icons/fa';
import { toast } from 'react-toastify';

// Simple, vendor-friendly styling
const Container = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
  flex-wrap: wrap;
  gap: 15px;
`;

const Title = styled.h2`
  color: #2c3e50;
  margin: 0;
  font-size: 1.8rem;
`;

const AddButton = styled.button`
  background: #27ae60;
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  transition: all 0.3s ease;
  
  &:hover {
    background: #229954;
    transform: translateY(-2px);
  }
`;

const MenuGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 20px;
  margin-bottom: 30px;
`;

const MenuCard = styled.div`
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
  overflow: hidden;
  transition: all 0.3s ease;
  
  &:hover {
    transform: translateY(-5px);
    box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
  }
`;

const ImageContainer = styled.div`
  width: 100%;
  height: 200px;
  background: #f8f9fa;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  overflow: hidden;
`;

const FoodImage = styled.img`
  width: 100%;
  height: 100%;
  object-fit: cover;
`;

const NoImagePlaceholder = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: #666;
  font-size: 1.1rem;
  font-weight: 600;
  text-align: center;
  padding: 20px;
`;

const CardContent = styled.div`
  padding: 20px;
`;

const FoodName = styled.h3`
  margin: 0 0 8px 0;
  color: #2c3e50;
  font-size: 1.3rem;
  font-weight: 600;
`;

const FoodPrice = styled.div`
  font-size: 1.4rem;
  font-weight: 700;
  color: #27ae60;
  margin-bottom: 10px;
`;

const FoodDescription = styled.p`
  color: #666;
  margin: 0 0 15px 0;
  line-height: 1.5;
  font-size: 0.95rem;
`;

const CardActions = styled.div`
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
`;

const ActionButton = styled.button<{ $variant?: 'edit' | 'delete' | 'toggle' }>`
  padding: 8px 12px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.85rem;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 5px;
  transition: all 0.3s ease;
  
  background: ${(props: { $variant?: 'edit' | 'delete' | 'toggle' }) => {
    switch (props.$variant) {
      case 'edit': return '#3498db';
      case 'delete': return '#e74c3c';
      case 'toggle': return '#f39c12';
      default: return '#95a5a6';
    }
  }};
  
  color: white;
  
  &:hover {
    opacity: 0.9;
    transform: translateY(-1px);
  }
`;

const AvailabilityBadge = styled.div<{ $available: boolean }>`
  position: absolute;
  top: 10px;
  right: 10px;
  background: ${(props: { $available: boolean }) => props.$available ? '#27ae60' : '#e74c3c'};
  color: white;
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
`;

// Simple form modal
const Modal = styled.div<{ $isOpen: boolean }>`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: ${(props: { $isOpen: boolean }) => props.$isOpen ? 'flex' : 'none'};
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 20px;
`;

const ModalContent = styled.div`
  background: white;
  padding: 30px;
  border-radius: 12px;
  width: 100%;
  max-width: 500px;
  max-height: 90vh;
  overflow-y: auto;
`;

const FormGroup = styled.div`
  margin-bottom: 20px;
`;

const Label = styled.label`
  display: block;
  margin-bottom: 8px;
  font-weight: 600;
  color: #2c3e50;
  font-size: 1rem;
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
    border-color: #3498db;
  }
`;

const TextArea = styled.textarea`
  width: 100%;
  padding: 12px;
  border: 2px solid #e9ecef;
  border-radius: 8px;
  font-size: 1rem;
  min-height: 100px;
  resize: vertical;
  transition: border-color 0.3s ease;
  
  &:focus {
    outline: none;
    border-color: #3498db;
  }
`;

const ImageUpload = styled.div`
  border: 2px dashed #bdc3c7;
  border-radius: 8px;
  padding: 30px;
  text-align: center;
  cursor: pointer;
  transition: all 0.3s ease;
  
  &:hover {
    border-color: #3498db;
    background: #f8f9fa;
  }
`;

const ModalActions = styled.div`
  display: flex;
  gap: 15px;
  justify-content: flex-end;
  margin-top: 30px;
`;

interface MenuItem {
  id: string;
  name: string;
  price: number;
  description: string;
  image_url?: string;
  is_available: boolean;
  category: string;
}

interface SimpleMenuManagerProps {
  menuItems: MenuItem[];
  onAddItem: (item: Omit<MenuItem, 'id'>) => Promise<void>;
  onUpdateItem: (id: string, item: Partial<MenuItem>) => Promise<void>;
  onDeleteItem: (id: string) => Promise<void>;
}

const SimpleMenuManager: React.FC<SimpleMenuManagerProps> = ({
  menuItems,
  onAddItem,
  onUpdateItem,
  onDeleteItem
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    price: '',
    description: '',
    category: '',
    image_url: '',
    is_available: true
  });

  const resetForm = () => {
    setFormData({
      name: '',
      price: '',
      description: '',
      category: '',
      image_url: '',
      is_available: true
    });
    setEditingItem(null);
  };

  const openAddModal = () => {
    resetForm();
    setIsModalOpen(true);
  };

  const openEditModal = (item: MenuItem) => {
    setFormData({
      name: item.name,
      price: item.price.toString(),
      description: item.description,
      category: item.category,
      image_url: item.image_url || '',
      is_available: item.is_available
    });
    setEditingItem(item);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim() || !formData.price) {
      toast.error('Please fill in food name and price');
      return;
    }

    const price = parseFloat(formData.price);
    if (isNaN(price) || price <= 0) {
      toast.error('Please enter a valid price');
      return;
    }

    try {
      const itemData = {
        name: formData.name.trim(),
        price,
        description: formData.description.trim(),
        category: formData.category.trim() || 'Main Course',
        image_url: formData.image_url.trim() || undefined,
        is_available: formData.is_available
      };

      if (editingItem) {
        await onUpdateItem(editingItem.id, itemData);
        toast.success('Food item updated successfully!');
      } else {
        await onAddItem(itemData);
        toast.success('Food item added successfully!');
      }

      setIsModalOpen(false);
      resetForm();
    } catch (error) {
      toast.error('Failed to save food item. Please try again.');
    }
  };

  const handleDelete = async (item: MenuItem) => {
    if (window.confirm(`Are you sure you want to delete "${item.name}"?`)) {
      try {
        await onDeleteItem(item.id);
        toast.success('Food item deleted successfully!');
      } catch (error) {
        toast.error('Failed to delete food item. Please try again.');
      }
    }
  };

  const toggleAvailability = async (item: MenuItem) => {
    try {
      await onUpdateItem(item.id, { is_available: !item.is_available });
      toast.success(`${item.name} is now ${!item.is_available ? 'available' : 'unavailable'}`);
    } catch (error) {
      toast.error('Failed to update availability. Please try again.');
    }
  };

  return (
    <Container>
      <Header>
        <Title>My Food Menu</Title>
        <AddButton onClick={openAddModal}>
          <FaPlus />
          Add New Food Item
        </AddButton>
      </Header>

      <MenuGrid>
        {menuItems.map(item => (
          <MenuCard key={item.id}>
            <ImageContainer>
              {item.image_url ? (
                <FoodImage src={item.image_url} alt={item.name} />
              ) : (
                <NoImagePlaceholder>
                  <FaImage size={40} style={{ marginBottom: '10px', color: '#bdc3c7' }} />
                  {item.name}
                </NoImagePlaceholder>
              )}
              <AvailabilityBadge $available={item.is_available}>
                {item.is_available ? 'Available' : 'Unavailable'}
              </AvailabilityBadge>
            </ImageContainer>
            
            <CardContent>
              <FoodName>{item.name}</FoodName>
              <FoodPrice>₹{item.price.toFixed(2)}</FoodPrice>
              {item.description && (
                <FoodDescription>{item.description}</FoodDescription>
              )}
              
              <CardActions>
                <ActionButton $variant="edit" onClick={() => openEditModal(item)}>
                  <FaEdit />
                  Edit
                </ActionButton>
                
                <ActionButton $variant="toggle" onClick={() => toggleAvailability(item)}>
                  {item.is_available ? <FaEyeSlash /> : <FaEye />}
                  {item.is_available ? 'Hide' : 'Show'}
                </ActionButton>
                
                <ActionButton $variant="delete" onClick={() => handleDelete(item)}>
                  <FaTrash />
                  Delete
                </ActionButton>
              </CardActions>
            </CardContent>
          </MenuCard>
        ))}
      </MenuGrid>

      {menuItems.length === 0 && (
        <div style={{ textAlign: 'center', padding: '60px 20px', color: '#666' }}>
          <FaImage size={60} style={{ marginBottom: '20px', color: '#bdc3c7' }} />
          <h3>No food items yet</h3>
          <p>Add your first food item to get started!</p>
        </div>
      )}

      <Modal $isOpen={isModalOpen}>
        <ModalContent>
          <h3>{editingItem ? 'Edit Food Item' : 'Add New Food Item'}</h3>
          
          <form onSubmit={handleSubmit}>
            <FormGroup>
              <Label>Food Name *</Label>
              <Input
                type="text"
                value={formData.name}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="e.g., Chicken Biryani"
                required
              />
            </FormGroup>

            <FormGroup>
              <Label>Price (₹) *</Label>
              <Input
                type="number"
                step="0.01"
                min="0"
                value={formData.price}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData(prev => ({ ...prev, price: e.target.value }))}
                placeholder="e.g., 150"
                required
              />
            </FormGroup>

            <FormGroup>
              <Label>Category</Label>
              <Input
                type="text"
                value={formData.category}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                placeholder="e.g., Main Course, Snacks, Beverages"
              />
            </FormGroup>

            <FormGroup>
              <Label>Description</Label>
              <TextArea
                value={formData.description}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Describe your food item..."
              />
            </FormGroup>

            <FormGroup>
              <Label>Image URL (Optional)</Label>
              <Input
                type="url"
                value={formData.image_url}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData(prev => ({ ...prev, image_url: e.target.value }))}
                placeholder="https://example.com/image.jpg"
              />
              <small style={{ color: '#666', fontSize: '0.85rem', marginTop: '5px', display: 'block' }}>
                Leave empty to show food name instead of image
              </small>
            </FormGroup>

            <FormGroup>
              <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={formData.is_available}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData(prev => ({ ...prev, is_available: e.target.checked }))}
                />
                <span>Available for orders</span>
              </label>
            </FormGroup>

            <ModalActions>
              <ActionButton type="button" onClick={() => setIsModalOpen(false)}>
                Cancel
              </ActionButton>
              <ActionButton $variant="edit" type="submit">
                {editingItem ? 'Update' : 'Add'} Food Item
              </ActionButton>
            </ModalActions>
          </form>
        </ModalContent>
      </Modal>
    </Container>
  );
};

export default SimpleMenuManager;
