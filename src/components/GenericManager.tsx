import React, { useRef, useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Upload, Download, Plus, Trash2, GripVertical } from 'lucide-react';
import { Reorder, useDragControls } from 'motion/react';
import { downloadCSV, parseCSV } from '../utils/csv';

export function GenericManager<T extends { id: string, name: string }>({ 
  data, setData, title, dataType, emptyItem, customColumns, renderCustomFields, setConfirmDialog, simplifiedLayout, processUpload, prepareDownload, allowReorder
}: { 
  data: T[], 
  setData: (d: T[]) => void, 
  title: string,
  dataType: string,
  emptyItem: () => T, 
  customColumns?: string[], 
  renderCustomFields?: (item: T, updateItem: (id: string, field: keyof T, value: any) => void) => React.ReactNode, 
  setConfirmDialog: (dialog: { message: string, onConfirm: () => void } | null) => void,
  simplifiedLayout?: boolean,
  processUpload?: (data: any[]) => T[],
  prepareDownload?: (data: T[]) => any[],
  allowReorder?: boolean
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [headerTarget, setHeaderTarget] = useState<HTMLElement | null>(null);

  useEffect(() => {
    setHeaderTarget(document.getElementById('header-actions'));
  }, []);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      parseCSV<any>(e.target.files[0], (parsed) => {
        const processed = processUpload ? processUpload(parsed) : parsed;
        setData(processed);
      });
      e.target.value = '';
    }
  };

  const addItem = () => {
    setData([...data, emptyItem()]);
  };

  const updateItem = (id: string, field: keyof T, value: any) => {
    setData(data.map(d => d.id === id ? { ...d, [field]: value } : d));
  };

  const removeSelected = () => {
    if (selectedIds.size === 0) return;
    setConfirmDialog({
      message: `確定要刪除選取的 ${selectedIds.size} 筆資料嗎？`,
      onConfirm: () => {
        setData(data.filter(d => !selectedIds.has(d.id)));
        setSelectedIds(new Set());
        setConfirmDialog(null);
      }
    });
  };

  const removeSingle = (id: string) => {
    setConfirmDialog({
      message: '確定要刪除這筆資料嗎？',
      onConfirm: () => {
        setData(data.filter(d => d.id !== id));
        const newSet = new Set(selectedIds);
        newSet.delete(id);
        setSelectedIds(newSet);
        setConfirmDialog(null);
      }
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === data.length && data.length > 0) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(data.map(d => d.id)));
    }
  };

  const toggleSelect = (id: string) => {
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setSelectedIds(newSet);
  };

  const actionButtons = (
    <div className="flex gap-2">
      {selectedIds.size > 0 && (
        <button onClick={removeSelected} className="flex items-center gap-2 px-4 py-1.5 bg-[#FAF5F5] text-[#A34A4A] border border-[#E8D0D0] rounded-full text-sm font-medium hover:bg-[#F5EAEA] transition-colors mr-2">
          <Trash2 size={14} /> ({selectedIds.size})
        </button>
      )}
      <input type="file" accept=".csv" className="hidden" ref={fileInputRef} onChange={handleUpload} />
      <button onClick={() => fileInputRef.current?.click()} className="flex items-center gap-2 px-4 py-1.5 border border-[#5A5A40] text-[#5A5A40] rounded-full text-sm font-medium hover:bg-[#5A5A40]/5 transition-colors shadow-sm">
        <Upload size={14} />
      </button>
      <button onClick={() => {
        const dataToDownload = prepareDownload ? prepareDownload(data) : data;
        downloadCSV(dataToDownload, `${dataType}.csv`);
      }} className="flex items-center gap-2 px-4 py-1.5 border border-[#5A5A40] text-[#5A5A40] rounded-full text-sm font-medium hover:bg-[#5A5A40]/5 transition-colors shadow-sm">
        <Download size={14} />
      </button>
      <button onClick={addItem} className="flex items-center gap-2 px-4 py-1.5 bg-[#5A5A40] text-white rounded-full text-sm font-medium shadow-sm hover:bg-[#4A4A3A] transition-colors">
        <Plus size={14} />
      </button>
    </div>
  );

  return (
    <div className="flex flex-col h-full min-h-0">
      {!simplifiedLayout && (
        <div className="flex justify-between items-center mb-6 shrink-0">
          <h2 className="text-lg font-semibold text-[#4A4A3A]">{title}</h2>
          {actionButtons}
        </div>
      )}
      {simplifiedLayout && headerTarget && createPortal(actionButtons, headerTarget)}
      
      <div className="flex-1 overflow-auto rounded-xl border border-[#E5E1D5]">
        <table className="w-full text-left text-sm relative">
          <thead className="bg-[#F9F8F4] border-b border-[#E5E1D5] sticky top-0 z-10 shadow-sm">
            <tr className="text-[11px] text-[#8A8475] uppercase tracking-wider">
              <th className={`px-4 py-4 ${allowReorder ? 'w-16' : 'w-10'} text-center`}>
                <input type="checkbox" checked={selectedIds.size === data.length && data.length > 0} onChange={toggleSelectAll} className="rounded text-[#5A5A40] focus:ring-[#5A5A40] border-[#D9D4C7]" />
              </th>
              <th className="px-6 py-4 font-bold">代碼</th>
              <th className="px-6 py-4 font-bold">名稱</th>
              {customColumns?.map(col => <th key={col} className="px-6 py-4 font-bold">{col}</th>)}
              <th className="px-6 py-4 font-bold text-right">操作</th>
            </tr>
          </thead>
          {allowReorder && data.length > 0 ? (
            <Reorder.Group as="tbody" values={data} onReorder={setData} className="divide-y divide-[#F2EFE9]">
              {data.map(item => (
                <DraggableRow
                  key={item.id}
                  item={item}
                  selectedIds={selectedIds}
                  toggleSelect={toggleSelect}
                  updateItem={updateItem}
                  removeSingle={removeSingle}
                  renderCustomFields={renderCustomFields}
                />
              ))}
            </Reorder.Group>
          ) : (
            <tbody className="divide-y divide-[#F2EFE9]">
              {data.map(item => (
                <tr key={item.id} className={`transition-colors group ${selectedIds.has(item.id) ? 'bg-[#FDFBF7]' : 'hover:bg-[#FDFBF7]'}`}>
                  <td className="px-4 py-3 text-center">
                    <input type="checkbox" checked={selectedIds.has(item.id)} onChange={() => toggleSelect(item.id)} className="rounded text-[#5A5A40] focus:ring-[#5A5A40] border-[#D9D4C7]" />
                  </td>
                  <td className="px-6 py-3 font-mono text-[#8A8475]">
                    <input type="text" value={item.id} onChange={e => updateItem(item.id, 'id', e.target.value)} className="w-full bg-transparent border-b border-transparent focus:border-[#5A5A40] focus:outline-none focus:ring-0 px-1 py-1" placeholder="輸入 ID" />
                  </td>
                  <td className="px-6 py-3 text-[#2D2D2A]">
                    <input type="text" value={item.name} onChange={e => updateItem(item.id, 'name', e.target.value)} className="w-full bg-transparent border-b border-transparent focus:border-[#5A5A40] focus:outline-none focus:ring-0 px-1 py-1" placeholder="輸入名稱" />
                  </td>
                  {renderCustomFields && renderCustomFields(item, updateItem)}
                  <td className="px-6 py-3 text-right">
                    <button onClick={() => removeSingle(item.id)} className="text-[#8A8475] hover:text-[#E06C6C] p-1.5 rounded-md hover:bg-[#F2EFE9] transition-colors opacity-0 group-hover:opacity-100">
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
              {data.length === 0 && (
                <tr>
                  <td colSpan={4 + (customColumns?.length || 0)} className="px-6 py-12 text-center text-[#8A8475] text-sm bg-white">目前沒有資料，請點擊上方按鈕新增</td>
                </tr>
              )}
            </tbody>
          )}
        </table>
      </div>
    </div>
  );
}

function DraggableRow({ item, selectedIds, toggleSelect, updateItem, removeSingle, renderCustomFields }: any) {
  const controls = useDragControls();

  return (
    <Reorder.Item 
      as="tr" 
      value={item} 
      dragListener={false} 
      dragControls={controls}
      className={`transition-colors group ${selectedIds.has(item.id) ? 'bg-[#FDFBF7]' : 'bg-white hover:bg-[#FDFBF7]'}`}
    >
      <td className="px-4 py-3 text-center">
        <div className="flex items-center justify-center gap-2">
          <div 
            className="cursor-grab active:cursor-grabbing text-[#D9D4C7] hover:text-[#8A8475] transition-colors" 
            title="拖曳排序"
            onPointerDown={(e) => controls.start(e)}
          >
            <GripVertical size={16} />
          </div>
          <input type="checkbox" checked={selectedIds.has(item.id)} onChange={() => toggleSelect(item.id)} className="rounded text-[#5A5A40] focus:ring-[#5A5A40] border-[#D9D4C7]" />
        </div>
      </td>
      <td className="px-6 py-3 font-mono text-[#8A8475]">
        <input type="text" value={item.id} onChange={e => updateItem(item.id, 'id', e.target.value)} className="w-full bg-transparent border-b border-transparent focus:border-[#5A5A40] focus:outline-none focus:ring-0 px-1 py-1" placeholder="輸入 ID" />
      </td>
      <td className="px-6 py-3 text-[#2D2D2A]">
        <input type="text" value={item.name} onChange={e => updateItem(item.id, 'name', e.target.value)} className="w-full bg-transparent border-b border-transparent focus:border-[#5A5A40] focus:outline-none focus:ring-0 px-1 py-1" placeholder="輸入名稱" />
      </td>
      {renderCustomFields && renderCustomFields(item, updateItem)}
      <td className="px-6 py-3 text-right">
        <button onClick={() => removeSingle(item.id)} className="text-[#8A8475] hover:text-[#E06C6C] p-1.5 rounded-md hover:bg-[#F2EFE9] transition-colors opacity-0 group-hover:opacity-100">
          <Trash2 size={16} />
        </button>
      </td>
    </Reorder.Item>
  );
}
