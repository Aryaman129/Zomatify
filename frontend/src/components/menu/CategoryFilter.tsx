import React from 'react';
import styled from 'styled-components';
import { motion } from 'framer-motion';

interface CategoryFilterProps {
  categories: string[];
  selectedCategory: string;
  onSelectCategory: (category: string) => void;
}

const FilterContainer = styled.div`
  padding: 16px;
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
  margin-bottom: 8px;
  
  /* Hide scrollbar for Chrome, Safari and Opera */
  &::-webkit-scrollbar {
    display: none;
  }
  
  /* IE and Edge */
  -ms-overflow-style: none;
  /* Firefox */
  scrollbar-width: none;
`;

const CategoryList = styled.div`
  display: flex;
  gap: 12px;
  padding-bottom: 8px; /* Add space for shadow */
`;

const CategoryButton = styled(motion.button)<{ $isSelected: boolean }>`
  background-color: ${(props: { $isSelected: boolean }) => props.$isSelected ? '#FF5A5F' : 'white'};
  color: ${(props: { $isSelected: boolean }) => props.$isSelected ? 'white' : '#333'};
  border: 2px solid ${(props: { $isSelected: boolean }) => props.$isSelected ? '#FF5A5F' : '#E0E0E0'};
  border-radius: 30px;
  padding: 12px 24px;
  font-size: 1.1rem;
  font-weight: 600;
  white-space: nowrap;
  cursor: pointer;
  min-height: 52px; /* Larger touch target */
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  
  &:focus-visible {
    outline: 3px solid #007bff;
    outline-offset: 2px;
  }
`;

const AllCategoryButton = styled(CategoryButton)`
  background-color: ${(props: { $isSelected: boolean }) => props.$isSelected ? '#009688' : 'white'};
  border-color: ${(props: { $isSelected: boolean }) => props.$isSelected ? '#009688' : '#E0E0E0'};
`;

const CategoryFilter: React.FC<CategoryFilterProps> = ({
  categories,
  selectedCategory,
  onSelectCategory
}) => {
  // Reference to the filter container for scrolling
  const filterContainerRef = React.useRef<HTMLDivElement>(null);
  
  // Ensure the active category is visible by scrolling to it
  React.useEffect(() => {
    const container = filterContainerRef.current;
    if (!container) return;
    
    const activeButton = container.querySelector(`[data-category="${selectedCategory}"]`) as HTMLElement;
    if (!activeButton) return;
    
    const containerRect = container.getBoundingClientRect();
    const buttonRect = activeButton.getBoundingClientRect();
    
    // Check if button is not fully visible
    if (buttonRect.left < containerRect.left || buttonRect.right > containerRect.right) {
      // Smooth scroll to make button visible
      container.scrollTo({
        left: activeButton.offsetLeft - containerRect.width / 2 + buttonRect.width / 2,
        behavior: 'smooth'
      });
    }
  }, [selectedCategory]);
  
  return (
    <FilterContainer ref={filterContainerRef}>
      <CategoryList>
        <AllCategoryButton
          $isSelected={selectedCategory === 'all'}
          onClick={() => onSelectCategory('all')}
          whileTap={{ scale: 0.95 }}
          data-category="all"
          aria-pressed={selectedCategory === 'all'}
        >
          All Items
        </AllCategoryButton>
        
        {categories.map((category) => (
          <CategoryButton
            key={category}
            $isSelected={selectedCategory === category}
            onClick={() => onSelectCategory(category)}
            whileTap={{ scale: 0.95 }}
            data-category={category}
            aria-pressed={selectedCategory === category}
          >
            {category.charAt(0).toUpperCase() + category.slice(1)}
          </CategoryButton>
        ))}
      </CategoryList>
    </FilterContainer>
  );
};

export default CategoryFilter;
