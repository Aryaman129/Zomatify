import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { FaBoxes, FaExclamationTriangle, FaPlus, FaEdit, FaCheck } from 'react-icons/fa';
import { inventoryService } from '../services/enhancedApi';
import { toast } from 'react-toastify';

interface InventoryItem {
  id: string;
  menu_item_id: string;
  stock_quantity: number;
  low_stock_threshold: number;
  auto_disable_when_out: boolean;
  last_restocked_at: string;
  menu_item: {
    id: string;
    name: string;
    price: number;
    is_available: boolean;
  };
}

const InventoryContainer = styled.div`
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  overflow: hidden;
`;

const InventoryHeader = styled.div`
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const InventoryTitle = styled.h3`
  margin: 0;
  display: flex;
  align-items: center;
  gap: 10px;
`;

const InventoryGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 20px;
  padding: 20px;
`;

const InventoryCard = styled.div<{ $isLowStock: boolean }>`
  border: 2px solid ${(props: { $isLowStock: boolean }) => props.$isLowStock ? '#ff6b6b' : '#e9ecef'};
  border-radius: 8px;
  padding: 15px;
  background: ${(props: { $isLowStock: boolean }) => props.$isLowStock ? '#fff5f5' : 'white'};
  transition: all 0.3s ease;

  &:hover {
    box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
  }
`;

const ItemHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 10px;
`;

const ItemName = styled.h4`
  margin: 0;
  color: #2c3e50;
  font-size: 1.1rem;
`;

const StockBadge = styled.div<{ $isLowStock: boolean }>`
  background: ${(props: { $isLowStock: boolean }) => props.$isLowStock ? '#ff6b6b' : '#28a745'};
  color: white;
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 0.8rem;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 5px;
`;

const StockInfo = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
  margin-bottom: 15px;
`;

const InfoItem = styled.div`
  text-align: center;
  padding: 8px;
  background: #f8f9fa;
  border-radius: 6px;
`;

const InfoLabel = styled.div`
  font-size: 0.8rem;
  color: #666;
  margin-bottom: 2px;
`;

const InfoValue = styled.div`
  font-weight: 600;
  color: #2c3e50;
`;

const ActionButtons = styled.div`
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
`;

const ActionButton = styled.button<{ $variant?: 'primary' | 'success' | 'warning' }>`
  padding: 6px 12px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.8rem;
  display: flex;
  align-items: center;
  gap: 5px;
  transition: all 0.3s ease;

  background: ${(props: { $variant?: 'primary' | 'success' | 'warning' }) => {
    switch (props.$variant) {
      case 'success': return '#28a745';
      case 'warning': return '#ffc107';
      default: return '#667eea';
    }
  }};

  color: ${(props: { $variant?: 'primary' | 'success' | 'warning' }) => props.$variant === 'warning' ? '#000' : 'white'};

  &:hover {
    opacity: 0.9;
    transform: translateY(-1px);
  }
`;

const RestockModal = styled.div<{ $isOpen: boolean }>`
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
`;

const ModalContent = styled.div`
  background: white;
  padding: 30px;
  border-radius: 12px;
  width: 90%;
  max-width: 400px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
`;

const ModalTitle = styled.h3`
  margin: 0 0 20px 0;
  color: #2c3e50;
`;

const FormGroup = styled.div`
  margin-bottom: 15px;
`;

const Label = styled.label`
  display: block;
  margin-bottom: 5px;
  font-weight: 600;
  color: #2c3e50;
`;

const Input = styled.input`
  width: 100%;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 1rem;
  
  &:focus {
    outline: none;
    border-color: #667eea;
    box-shadow: 0 0 0 2px rgba(102, 126, 234, 0.2);
  }
`;

const ModalButtons = styled.div`
  display: flex;
  gap: 10px;
  justify-content: flex-end;
  margin-top: 20px;
`;

const InventoryManager: React.FC = () => {
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [restockModal, setRestockModal] = useState<{
    isOpen: boolean;
    item: InventoryItem | null;
    quantity: number;
  }>({
    isOpen: false,
    item: null,
    quantity: 0
  });

  useEffect(() => {
    loadInventory();
  }, []);

  const loadInventory = async () => {
    setLoading(true);
    try {
      const result = await inventoryService.getInventoryStatus();
      if (result.success) {
        setInventory(result.data || []);
      } else {
        toast.error('Failed to load inventory data');
      }
    } catch (error) {
      console.error('Error loading inventory:', error);
      toast.error('Failed to load inventory data');
    } finally {
      setLoading(false);
    }
  };

  const handleRestock = async () => {
    if (!restockModal.item || restockModal.quantity <= 0) return;

    try {
      const result = await inventoryService.restockItem(
        restockModal.item.menu_item_id,
        restockModal.quantity
      );

      if (result.success) {
        toast.success(`Successfully restocked ${restockModal.item.menu_item.name}`);
        setRestockModal({ isOpen: false, item: null, quantity: 0 });
        loadInventory(); // Reload inventory
      } else {
        toast.error('Failed to restock item');
      }
    } catch (error) {
      console.error('Error restocking item:', error);
      toast.error('Failed to restock item');
    }
  };

  const handleUpdateThreshold = async (item: InventoryItem, newThreshold: number) => {
    try {
      const result = await inventoryService.updateInventory(
        item.menu_item_id,
        item.stock_quantity,
        newThreshold
      );

      if (result.success) {
        toast.success('Threshold updated successfully');
        loadInventory();
      } else {
        toast.error('Failed to update threshold');
      }
    } catch (error) {
      console.error('Error updating threshold:', error);
      toast.error('Failed to update threshold');
    }
  };

  const isLowStock = (item: InventoryItem) => {
    return item.stock_quantity <= item.low_stock_threshold;
  };

  if (loading) {
    return <div>Loading inventory...</div>;
  }

  return (
    <>
      <InventoryContainer>
        <InventoryHeader>
          <InventoryTitle>
            <FaBoxes />
            Inventory Management
          </InventoryTitle>
          <div>
            {inventory.filter(isLowStock).length > 0 && (
              <StockBadge $isLowStock={true}>
                <FaExclamationTriangle />
                {inventory.filter(isLowStock).length} Low Stock
              </StockBadge>
            )}
          </div>
        </InventoryHeader>

        <InventoryGrid>
          {inventory.map(item => (
            <InventoryCard key={item.id} $isLowStock={isLowStock(item)}>
              <ItemHeader>
                <ItemName>{item.menu_item.name}</ItemName>
                <StockBadge $isLowStock={isLowStock(item)}>
                  {isLowStock(item) ? <FaExclamationTriangle /> : <FaCheck />}
                  {item.stock_quantity}
                </StockBadge>
              </ItemHeader>

              <StockInfo>
                <InfoItem>
                  <InfoLabel>Current Stock</InfoLabel>
                  <InfoValue>{item.stock_quantity}</InfoValue>
                </InfoItem>
                <InfoItem>
                  <InfoLabel>Low Stock Alert</InfoLabel>
                  <InfoValue>{item.low_stock_threshold}</InfoValue>
                </InfoItem>
              </StockInfo>

              <ActionButtons>
                <ActionButton
                  $variant="primary"
                  onClick={() => setRestockModal({
                    isOpen: true,
                    item,
                    quantity: 0
                  })}
                >
                  <FaPlus /> Restock
                </ActionButton>
                
                <ActionButton
                  $variant="warning"
                  onClick={() => {
                    const newThreshold = prompt(
                      `Enter new low stock threshold for ${item.menu_item.name}:`,
                      item.low_stock_threshold.toString()
                    );
                    if (newThreshold && !isNaN(parseInt(newThreshold))) {
                      handleUpdateThreshold(item, parseInt(newThreshold));
                    }
                  }}
                >
                  <FaEdit /> Edit Threshold
                </ActionButton>
              </ActionButtons>
            </InventoryCard>
          ))}
        </InventoryGrid>
      </InventoryContainer>

      <RestockModal $isOpen={restockModal.isOpen}>
        <ModalContent>
          <ModalTitle>
            Restock {restockModal.item?.menu_item.name}
          </ModalTitle>
          
          <FormGroup>
            <Label>Current Stock: {restockModal.item?.stock_quantity}</Label>
          </FormGroup>
          
          <FormGroup>
            <Label>Add Quantity:</Label>
            <Input
              type="number"
              min="1"
              value={restockModal.quantity}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setRestockModal(prev => ({
                ...prev,
                quantity: parseInt(e.target.value) || 0
              }))}
              placeholder="Enter quantity to add"
            />
          </FormGroup>
          
          <FormGroup>
            <Label>
              New Total: {(restockModal.item?.stock_quantity || 0) + restockModal.quantity}
            </Label>
          </FormGroup>

          <ModalButtons>
            <ActionButton
              onClick={() => setRestockModal({ isOpen: false, item: null, quantity: 0 })}
            >
              Cancel
            </ActionButton>
            <ActionButton
              $variant="success"
              onClick={handleRestock}
              disabled={restockModal.quantity <= 0}
            >
              <FaCheck /> Confirm Restock
            </ActionButton>
          </ModalButtons>
        </ModalContent>
      </RestockModal>
    </>
  );
};

export default InventoryManager;
