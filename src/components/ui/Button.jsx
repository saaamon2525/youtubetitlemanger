import React from 'react';

const Button = ({ children, variant = 'primary', size = 'default', className = '', ...props }) => {
    const baseStyles = {
        padding: size === 'sm' ? '6px 12px' : '10px 20px',
        fontSize: size === 'sm' ? 'var(--font-size-sm)' : 'var(--font-size-base)',
        borderRadius: 'var(--radius-sm)',
        border: 'none',
        cursor: 'pointer',
        transition: 'background-color 0.2s',
        display: 'inline-flex',
        alignItems: 'center',
        gap: '8px',
        fontWeight: 500
    };

    const variants = {
        primary: {
            backgroundColor: 'var(--accent-color)',
            color: '#000', // YouTube Blue usually has white or black text depending on shade
        },
        secondary: {
            backgroundColor: 'var(--bg-hover)',
            color: 'var(--text-primary)',
        },
        danger: {
            backgroundColor: 'var(--error-color)',
            color: '#fff',
        },
        ghost: {
            backgroundColor: 'transparent',
            color: 'var(--text-secondary)',
        }
    };

    // Adjust style manually since we aren't using styled-components
    const style = { ...baseStyles, ...variants[variant] };

    return (
        <button style={style} className={className} {...props}>
            {children}
        </button>
    );
};

export default Button;
