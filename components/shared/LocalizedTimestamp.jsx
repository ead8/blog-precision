"use client"

import React, { useState, useEffect } from 'react';

/**
 * A component that renders a timestamp, ensuring it is always displayed
 * in the user's local timezone by formatting it exclusively on the client-side.
 * @param {{ dateString: string, options?: Intl.DateTimeFormatOptions }} props
 */
export default function LocalizedTimestamp({ dateString, options }) {
  const [formattedDate, setFormattedDate] = useState('...'); // Default placeholder

  useEffect(() => {
    // This effect runs only on the client-side
    if (dateString) {
      try {
        const date = new Date(dateString);
        // Default options if none are provided
        const formatOptions = options || {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
          hour: 'numeric',
          minute: '2-digit',
          hour12: true,
        };
        const newFormattedDate = new Intl.DateTimeFormat(undefined, formatOptions).format(date);
        setFormattedDate(newFormattedDate);
      } catch (error) {
        console.error("Failed to format date:", error);
        setFormattedDate(dateString); // Fallback to the original string on error
      }
    } else {
        setFormattedDate('N/A');
    }
  }, [dateString, options]);

  return <span>{formattedDate}</span>;
}