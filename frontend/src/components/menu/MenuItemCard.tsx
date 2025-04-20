import React from 'react';
import styled from 'styled-components';
import { FaPlus, FaMinus, FaHeart } from 'react-icons/fa';
import { motion } from 'framer-motion';
import { MenuItem } from '../../types';
import { useCart } from '../../contexts/CartContext';

interface MenuItemCardProps {
  item: MenuItem;
  onAddToCart?: () => void;
  onViewDetails?: () => void;
}

const CardContainer = styled(motion.div)`
  background-color: white;
  border-radius: 16px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  overflow: hidden;
  display: flex;
  flex-direction: column;
  margin-bottom: 16px;
  position: relative;
`;

const FavoriteButton = styled.button`
  position: absolute;
  top: 12px;
  right: 12px;
  background-color: white;
  border: none;
  border-radius: 50%;
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
  cursor: pointer;
  z-index: 5;
`;

const ItemImage = styled.img`
  width: 100%;
  height: 180px;
  object-fit: cover;
`;

const NoImage = styled.div`
  width: 100%;
  height: 180px;
  background-color: #f0f0f0;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #666;
  font-size: 1rem;
`;

const ContentContainer = styled.div`
  padding: 16px;
  flex: 1;
  display: flex;
  flex-direction: column;
`;

const ItemHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 12px;
`;

const ItemName = styled.h3`
  font-size: 1.25rem;
  margin: 0;
  color: #333;
  font-weight: 600;
`;

const ItemPrice = styled.span`
  font-size: 1.25rem;
  font-weight: 600;
  color: #FF5A5F;
`;

const ItemDescription = styled.p`
  font-size: 1rem;
  color: #666;
  margin-bottom: 16px;
  flex: 1;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const ItemMeta = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.875rem;
  color: #666;
  margin-bottom: 16px;
`;

const ItemTags = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 16px;
`;

const Tag = styled.span`
  background-color: #f0f0f0;
  padding: 4px 10px;
  border-radius: 20px;
  font-size: 0.8rem;
  color: #666;
`;

const ActionBar = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const QuantityControl = styled.div`
  display: flex;
  align-items: center;
  border: 1px solid #ddd;
  border-radius: 8px;
  overflow: hidden;
`;

const QuantityButton = styled.button`
  background-color: #f0f0f0;
  border: none;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;

  &:hover {
    background-color: #e0e0e0;
  }

  &:active {
    background-color: #d0d0d0;
  }
`;

const QuantityDisplay = styled.span`
  width: 40px;
  text-align: center;
  font-size: 1rem;
  user-select: none;
`;

const AddButton = styled.button`
  background-color: #FF5A5F;
  color: white;
  border: none;
  border-radius: 8px;
  padding: 12px 20px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: background-color 0.2s;
  min-width: 150px;

  &:hover {
    background-color: #E54B50;
  }

  &:active {
    background-color: #D43E43;
  }
`;

const PrepTime = styled.div`
  font-size: 0.9rem;
  color: #666;
`;

const Rating = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
  font-weight: 600;
  color: #FF8C00;
`;

const MenuItemCard: React.FC<MenuItemCardProps> = ({ 
  item, 
  onAddToCart, 
  onViewDetails 
}) => {
  const [quantity, setQuantity] = React.useState(1);
  const [isFavorite, setIsFavorite] = React.useState(false);
  const { addItem } = useCart();

  const handleQuantityDecrease = () => {
    if (quantity > 1) {
      setQuantity(quantity - 1);
    }
  };

  const handleQuantityIncrease = () => {
    setQuantity(quantity + 1);
  };

  const handleAddToCart = () => {
    addItem(item, quantity);
    setQuantity(1);
    if (onAddToCart) {
      onAddToCart();
    }
  };

  const toggleFavorite = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsFavorite(!isFavorite);
  };

  const handleCardClick = () => {
    if (onViewDetails) {
      onViewDetails();
    }
  };

  return (
    <CardContainer 
      whileHover={{ y: -5, transition: { duration: 0.2 } }}
      onClick={handleCardClick}
    >
      <FavoriteButton onClick={toggleFavorite} aria-label={isFavorite ? "Remove from favorites" : "Add to favorites"}>
        <FaHeart size={18} color={isFavorite ? "#FF5A5F" : "#CCCCCC"} />
      </FavoriteButton>
      
      {item.image_url ? (
        <ItemImage src={item.image_url} alt={item.name} />
      ) : (
        <NoImage>No Image Available</NoImage>
      )}
      
      <ContentContainer>
        <ItemHeader>
          <ItemName>{item.name}</ItemName>
          <ItemPrice>₹{item.price.toFixed(2)}</ItemPrice>
        </ItemHeader>
        
        <ItemDescription>{item.description}</ItemDescription>
        
        <ItemMeta>
          <PrepTime>Prep time: {item.preparation_time} mins</PrepTime>
          {item.rating && (
            <Rating>
              ★ {item.rating.toFixed(1)} ({item.review_count})
            </Rating>
          )}
        </ItemMeta>
        
        {item.tags && item.tags.length > 0 && (
          <ItemTags>
            {item.tags.slice(0, 3).map((tag, index) => (
              <Tag key={index}>{tag}</Tag>
            ))}
          </ItemTags>
        )}
        
        <ActionBar>
          <QuantityControl>
            <QuantityButton 
              onClick={(e: React.MouseEvent) => { e.stopPropagation(); handleQuantityDecrease(); }}
              aria-label="Decrease quantity"
            >
              <FaMinus size={16} />
            </QuantityButton>
            <QuantityDisplay>{quantity}</QuantityDisplay>
            <QuantityButton 
              onClick={(e: React.MouseEvent) => { e.stopPropagation(); handleQuantityIncrease(); }}
              aria-label="Increase quantity"
            >
              <FaPlus size={16} />
            </QuantityButton>
          </QuantityControl>
          
          <AddButton 
            onClick={(e: React.MouseEvent) => { e.stopPropagation(); handleAddToCart(); }}
            aria-label={`Add ${quantity} ${item.name} to cart`}
          >
            Add to Cart
          </AddButton>
        </ActionBar>
      </ContentContainer>
    </CardContainer>
  );
};

export default MenuItemCard;
