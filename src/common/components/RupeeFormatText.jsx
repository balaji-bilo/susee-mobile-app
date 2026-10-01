import React from 'react';
import { Text } from 'react-native';
import { fonts } from '../config/theme';

export const RupeeFormatText = ({ children, style, ...props }) => {
  const processChild = (child, idx = 0) => {
    if (typeof child === 'string') {
      const parts = child.split('₹');
      if (parts.length === 1) return child;
      
      return parts.map((part, index) => {
        if (index === 0) return <React.Fragment key={`${idx}-${index}`}>{part}</React.Fragment>;
        return (
          <React.Fragment key={`${idx}-${index}`}>
            <Text style={[{ fontFamily: fonts.inter }]}>₹</Text>
            {part}
          </React.Fragment>
        );
      });
    }
    
    if (Array.isArray(child)) {
      return child.map((c, i) => processChild(c, i));
    }
    
    return child;
  };

  return (
    <Text style={style} {...props}>
      {processChild(children)}
    </Text>
  );
};
