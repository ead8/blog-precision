
import React from 'react';
import { useLocale } from '@/components/context/LocaleContext';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Globe } from 'lucide-react';

const supportedLanguages = [
  { code: 'en-NZ', label: 'English (NZ)' },
  { code: 'en-US', label: 'English (US)' },
  { code: 'en-GB', label: 'English (UK)' },
  { code: 'en-AU', label: 'English (AU)' },
  { code: 'en-CA', label: 'English (CA)' },
  { code: 'es-ES', label: 'Español (España)' },
  { code: 'es-MX', label: 'Español (México)' },
  { code: 'fr-FR', label: 'Français (France)' },
  { code: 'de-DE', label: 'Deutsch (Deutschland)' },
];

export default function LanguageSelector() {
  const { locale, updateLocale } = useLocale();

  // Find the full label for the current locale to display in the trigger
  const currentLanguage = supportedLanguages.find(lang => lang.code === locale);
  const displayLabel = currentLanguage ? currentLanguage.label : locale;

  if (!locale) {
    return null; // Don't render if locale is not yet determined
  }

  return (
    <Select value={locale} onValueChange={updateLocale}>
      <SelectTrigger className="w-auto bg-orange-500 border-transparent text-black font-bold text-sm h-9 px-3 gap-2 shadow-sm hover:bg-orange-600 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
        <Globe className="w-4 h-4" />
        <SelectValue placeholder="Select Language">
          {displayLabel}
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        {supportedLanguages.map((lang) => (
          <SelectItem key={lang.code} value={lang.code}>
            {lang.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
