import { useLang } from '../context/LangContext';

export default function LanguageSelector() {
  const { lang, setLang } = useLang();

  return (
    <label className="language-selector" title={lang === 'am' ? 'ቋንቋ ይምረጡ' : 'Select language'}>
      <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
      </svg>
      <span className="sr-only">{lang === 'am' ? 'ቋንቋ' : 'Language'}</span>
      <select value={lang} onChange={event => setLang(event.target.value)} aria-label={lang === 'am' ? 'ቋንቋ ይምረጡ' : 'Select language'}>
        <option value="en">English</option>
        <option value="am">አማርኛ</option>
      </select>
    </label>
  );
}
