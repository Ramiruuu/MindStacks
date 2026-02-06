import { useEffect } from 'react';
import './App.css';
import './index.css';
import { useAppStore } from './store/appStore';
import { DeckList } from './components/DeckList';
import { FlashcardEditor } from './components/FlashcardEditor';
import { StudyView } from './components/StudyView';
import { BackupRestore } from './components/BackupRestore';

function App() {
  const loadDecks = useAppStore(state => state.loadDecks);
  const darkMode = useAppStore(state => state.darkMode);
  const toggleDarkMode = useAppStore(state => state.toggleDarkMode);

  useEffect(() => {
    loadDecks();
  }, []);

  return (
    <div className={`app-container ${darkMode ? 'dark' : 'light'} min-h-screen bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100`}>
      <header className="w-full border-b border-gray-200 dark:border-gray-800">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-bold">Mind Stack</h2>
            <span className="text-sm text-gray-500 dark:text-gray-400">AI Flashcards — free</span>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={toggleDarkMode}
              className="px-3 py-1 rounded-md bg-gray-100 dark:bg-gray-800 text-sm"
            >
              {darkMode ? 'Light' : 'Dark'}
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-6 grid grid-cols-1 md:grid-cols-4 gap-6">
        <aside className="md:col-span-1">
          <DeckList />
        </aside>

        <section className="md:col-span-3 space-y-6">
          <FlashcardEditor />
          <StudyView />
          <BackupRestore />
        </section>
      </main>
    </div>
  );
}

export default App;
