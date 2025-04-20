import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { motion } from 'framer-motion';
import { FaSearch, FaTimes } from 'react-icons/fa';
import AppHeader from '../components/common/AppHeader';
import MenuItemCard from '../components/menu/MenuItemCard';
import CategoryFilter from '../components/menu/CategoryFilter';
import { menuService } from '../services/api';
import { MenuItem } from '../types';
import { toast } from 'react-toastify';

const MenuContainer = styled.div`
  padding-bottom: 70px; /* Space for bottom nav */
`;

const SearchContainer = styled.div`
  padding: 16px;
  position: relative;
`;

const SearchInput = styled.input`
  width: 100%;
  padding: 15px 20px 15px 50px;
  border-radius: 30px;
  border: 1px solid #e0e0e0;
  font-size: 1.1rem;
  box-shadow: 0 2px 5px rgba(0,0,0,0.05);
  
  &:focus {
    outline: none;
    border-color: #FF5A5F;
    box-shadow: 0 2px 8px rgba(255,90,95,0.2);
  }
`;

const SearchIcon = styled.div`
  position: absolute;
  left: 30px;
  top: 50%;
  transform: translateY(-50%);
  color: #777;
`;

const ClearButton = styled.button`
  position: absolute;
  right: 30px;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  cursor: pointer;
  color: #777;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 8px;
`;

const RecommendationsContainer = styled.div`
  padding: 0 16px 16px;
`;

const SectionTitle = styled.h2`
  font-size: 1.5rem;
  font-weight: 600;
  margin: 0 0 16px;
  color: #333;
`;

const MenuItemsGrid = styled.div`
  padding: 0 16px 16px;
  display: grid;
  grid-template-columns: 1fr;
  gap: 20px;
  
  @media (min-width: 600px) {
    grid-template-columns: repeat(2, 1fr);
  }
  
  @media (min-width: 1024px) {
    grid-template-columns: repeat(3, 1fr);
  }
`;

const LoadingContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 200px;
`;

const NoResultsContainer = styled.div`
  text-align: center;
  padding: 30px 20px;
`;

const NoResultsText = styled.p`
  font-size: 1.2rem;
  color: #666;
`;

const FilterChips = styled.div`
  display: flex;
  flex-wrap: wrap;
  padding: 0 16px 16px;
  gap: 10px;
`;

const FilterChip = styled.div`
  display: flex;
  align-items: center;
  background-color: #f0f0f0;
  border-radius: 30px;
  padding: 8px 16px;
  font-size: 1rem;
  color: #333;
`;

const ChipText = styled.span`
  margin-right: 8px;
`;

const ChipClear = styled.button`
  background: none;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #666;
`;

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.3
    }
  }
};

const Menu: React.FC = () => {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [filteredItems, setFilteredItems] = useState<MenuItem[]>([]);
  const [recommendedItems, setRecommendedItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [categories, setCategories] = useState<string[]>([]);

  // Fetch menu items
  useEffect(() => {
    const fetchMenuItems = async () => {
      try {
        setLoading(true);
        const { success, data, error } = await menuService.getMenuItems();
        
        if (success && data) {
          setMenuItems(data);
          // Extract unique categories from menu items
          const uniqueCategories = Array.from(
            new Set(data.map(item => item.category))
          );
          setCategories(uniqueCategories);
          
          // Initially show all items
          setFilteredItems(data);
        } else {
          toast.error(error || 'Failed to load menu items');
        }
      } catch (error) {
        toast.error('An unexpected error occurred');
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    fetchMenuItems();
  }, []);
  
  // Fetch recommended items (in a real app, this would use the logged-in user's ID)
  useEffect(() => {
    const fetchRecommendations = async () => {
      try {
        // For now, just show top 3 items as "recommended"
        setRecommendedItems(menuItems.slice(0, 3));
        
        // In a real implementation with a logged-in user:
        // const { success, data } = await menuService.getRecommendations(userId);
        // if (success && data) {
        //   setRecommendedItems(data);
        // }
      } catch (error) {
        console.error('Failed to fetch recommendations:', error);
      }
    };
    
    if (menuItems.length > 0) {
      fetchRecommendations();
    }
  }, [menuItems]);

  // Apply filters when search query or category changes
  useEffect(() => {
    let results = [...menuItems];
    
    // Filter by category
    if (selectedCategory !== 'all') {
      results = results.filter(item => item.category === selectedCategory);
    }
    
    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      results = results.filter(
        item => 
          item.name.toLowerCase().includes(query) || 
          item.description.toLowerCase().includes(query) ||
          item.tags.some(tag => tag.toLowerCase().includes(query))
      );
    }
    
    setFilteredItems(results);
  }, [searchQuery, selectedCategory, menuItems]);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  const clearSearch = () => {
    setSearchQuery('');
  };

  const handleCategorySelect = (category: string) => {
    setSelectedCategory(category);
  };

  const clearCategory = () => {
    setSelectedCategory('all');
  };

  const handleAddToCart = (item: MenuItem) => {
    toast.success(`${item.name} added to cart!`);
  };

  return (
    <MenuContainer>
      <AppHeader 
        title="Food Menu" 
        showBackButton={false}
        showNotificationButton={true}
      />
      
      <SearchContainer>
        <SearchIcon>
          <FaSearch size={20} />
        </SearchIcon>
        <SearchInput
          type="text"
          placeholder="Search food items..."
          value={searchQuery}
          onChange={handleSearch}
          aria-label="Search menu items"
        />
        {searchQuery && (
          <ClearButton onClick={clearSearch} aria-label="Clear search">
            <FaTimes size={20} />
          </ClearButton>
        )}
      </SearchContainer>
      
      <CategoryFilter
        categories={categories}
        selectedCategory={selectedCategory}
        onSelectCategory={handleCategorySelect}
      />
      
      {/* Show active filters as chips for better UX */}
      {(selectedCategory !== 'all' || searchQuery) && (
        <FilterChips>
          {selectedCategory !== 'all' && (
            <FilterChip>
              <ChipText>Category: {selectedCategory}</ChipText>
              <ChipClear onClick={clearCategory} aria-label="Clear category filter">
                <FaTimes size={14} />
              </ChipClear>
            </FilterChip>
          )}
          
          {searchQuery && (
            <FilterChip>
              <ChipText>Search: {searchQuery}</ChipText>
              <ChipClear onClick={clearSearch} aria-label="Clear search filter">
                <FaTimes size={14} />
              </ChipClear>
            </FilterChip>
          )}
        </FilterChips>
      )}
      
      {/* Recommendations section */}
      {recommendedItems.length > 0 && selectedCategory === 'all' && !searchQuery && (
        <RecommendationsContainer>
          <SectionTitle>Recommended for You</SectionTitle>
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            {recommendedItems.map(item => (
              <motion.div key={item.id} variants={itemVariants}>
                <MenuItemCard
                  item={item}
                  onAddToCart={() => handleAddToCart(item)}
                />
              </motion.div>
            ))}
          </motion.div>
        </RecommendationsContainer>
      )}
      
      {/* Menu items section */}
      {loading ? (
        <LoadingContainer>
          <div className="loader"></div>
        </LoadingContainer>
      ) : filteredItems.length > 0 ? (
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          <SectionTitle style={{ padding: '0 16px' }}>
            {selectedCategory === 'all' ? 'All Items' : selectedCategory}
          </SectionTitle>
          <MenuItemsGrid>
            {filteredItems.map(item => (
              <motion.div key={item.id} variants={itemVariants}>
                <MenuItemCard
                  item={item}
                  onAddToCart={() => handleAddToCart(item)}
                />
              </motion.div>
            ))}
          </MenuItemsGrid>
        </motion.div>
      ) : (
        <NoResultsContainer>
          <NoResultsText>
            No items found. Try changing your search or category.
          </NoResultsText>
        </NoResultsContainer>
      )}
    </MenuContainer>
  );
};

export default Menu;
