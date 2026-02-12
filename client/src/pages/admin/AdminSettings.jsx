import React, { useState, useEffect } from 'react';
import { Save, Loader2, Timer, AlertCircle } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import api from '../../services/api';

const AdminSettings = () => {
   const [settings, setSettings] = useState({
      timerEnabled: false,
      timerEndTime: '',
      timerMessage: "Don't miss out on these great deals"
   });
   const [loading, setLoading] = useState(true);
   const [saving, setSaving] = useState(false);
   const [message, setMessage] = useState({ type: '', text: '' });

   useEffect(() => {
      const fetchSettings = async () => {
         try {
            const res = await api.get('/settings');
            const data = res.data.data;
            // Format date for datetime-local input
            if (data.timerEndTime) {
               data.timerEndTime = new Date(data.timerEndTime).toISOString().slice(0, 16);
            }
            setSettings(data);
         } catch (err) {
            console.error('Failed to fetch settings:', err);
         } finally {
            setLoading(false);
         }
      };
      fetchSettings();
   }, []);

   const handleSave = async (e) => {
      e.preventDefault();
      setSaving(true);
      setMessage({ type: '', text: '' });
      try {
         await api.put('/settings', settings);
         setMessage({ type: 'success', text: 'Settings synchronized successfully.' });
         setTimeout(() => setMessage({ type: '', text: '' }), 3000);
      } catch (err) {
         setMessage({ type: 'error', text: 'Synchronization failed: ' + (err.response?.data?.message || err.message) });
      } finally {
         setSaving(false);
      }
   };

   if (loading) return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-4">
         <Loader2 className="animate-spin text-black" size={32} />
         <p className="text-[10px] font-black uppercase tracking-[0.4em]">Retrieving System Protocol...</p>
      </div>
   );

   return (
      <div className="space-y-12 pb-40">
         {/* HEADER */}
         <div className="flex flex-col md:flex-row md:justify-between md:items-end border-b border-black pb-8 gap-6">
            <div className="space-y-4">
               <p className="text-small-brand text-gray-400">Global Configuration</p>
               <h1 className="text-5xl font-black uppercase tracking-tighter leading-none">System Settings</h1>
            </div>
         </div>

         <form onSubmit={handleSave} className="max-w-2xl space-y-12">
            {/* TIMER SECTION */}
            <div className="bg-white border border-black p-10 space-y-8">
               <div className="flex items-center gap-4 border-b border-black pb-6">
                  <div className="p-3 bg-black text-white">
                     <Timer size={20} />
                  </div>
                  <div>
                     <h2 className="text-xl font-black uppercase tracking-tight">Global Checkout Timer</h2>
                     <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest mt-1">Status: {settings.timerEnabled ? 'ACTIVE' : 'DEACTIVATED'}</p>
                  </div>
               </div>

               <div className="space-y-8">
                  {/* ENABLE TOGGLE */}
                  <div className="flex items-center justify-between p-6 bg-brand-grey border border-black/5">
                     <div className="space-y-1">
                        <p className="text-[10px] font-black uppercase tracking-widest">Enable Timer Protocol</p>
                        <p className="text-[9px] text-gray-400 font-medium uppercase tracking-widest">Displays a countdown on all product pages</p>
                     </div>
                     <button
                        type="button"
                        onClick={() => setSettings({ ...settings, timerEnabled: !settings.timerEnabled })}
                        className={`w-14 h-7 flex items-center transition-all duration-500 p-1 ${settings.timerEnabled ? 'bg-black' : 'bg-gray-200'}`}
                     >
                        <div className={`w-5 h-5 bg-white transition-all duration-500 shadow-sm ${settings.timerEnabled ? 'translate-x-7' : 'translate-x-0'}`} />
                     </button>
                  </div>

                  <div className={`space-y-6 transition-all duration-500 ${settings.timerEnabled ? 'opacity-100 pointer-events-auto' : 'opacity-40 pointer-events-none'}`}>
                     {/* TIMER MESSAGE */}
                     <div className="space-y-2">
                        <label className="text-[9px] font-black uppercase tracking-widest text-gray-400">Timer Label / Message</label>
                        <Input
                           value={settings.timerMessage}
                           onChange={(e) => setSettings({ ...settings, timerMessage: e.target.value })}
                           placeholder="e.g. FLASH SALE ENDING SOON"
                           className="rounded-none border-black focus:border-black text-[11px] font-bold uppercase tracking-widest h-12"
                        />
                     </div>

                     {/* END TIME */}
                     <div className="space-y-2">
                        <label className="text-[9px] font-black uppercase tracking-widest text-gray-400">Termination Timestamp</label>
                        <Input
                           type="datetime-local"
                           value={settings.timerEndTime}
                           onChange={(e) => setSettings({ ...settings, timerEndTime: e.target.value })}
                           className="rounded-none border-black focus:border-black text-[11px] font-bold h-12"
                        />
                     </div>
                  </div>
               </div>
            </div>

            {/* MESSAGE FEEDBACK */}
            {message.text && (
               <div className={`p-6 border flex items-center gap-4 animate-in fade-in slide-in-from-top-2 ${message.type === 'success' ? 'bg-green-50 border-green-200 text-green-800' : 'bg-red-50 border-red-200 text-red-800'}`}>
                  <AlertCircle size={16} />
                  <p className="text-[10px] font-black uppercase tracking-widest">{message.text}</p>
               </div>
            )}

            {/* SAVE BUTTON */}
            <div className="flex justify-start">
               <button
                  type="submit"
                  disabled={saving}
                  className="btn-brand px-12 py-5 font-black uppercase tracking-[0.2em] flex items-center gap-3"
               >
                  {saving ? (
                     <Loader2 className="animate-spin" size={16} />
                  ) : (
                     <Save size={16} />
                  )}
                  Save Protocol
               </button>
            </div>
         </form>
      </div>
   );
};

export default AdminSettings;
