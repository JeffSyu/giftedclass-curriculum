import React from 'react';

export function ConfirmModal({ message, onConfirm, onCancel, confirmText = '確定' }: { message: string, onConfirm: () => void, onCancel: () => void, confirmText?: string }) {
  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-[2px] z-[100] flex items-center justify-center p-6">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-sm overflow-hidden border border-[#E5E1D5]">
        <div className="p-6">
          <h3 className="text-lg font-bold text-[#4A4A3A] mb-2">確認操作</h3>
          <p className="text-[#8A8475] whitespace-pre-wrap">{message}</p>
        </div>
        <div className="bg-[#F9F8F4] px-6 py-4 flex justify-end gap-3 border-t border-[#E5E1D5]">
          <button onClick={onCancel} className="px-4 py-2 text-[#5A5A40] hover:bg-[#E8E4D9] rounded-lg font-medium transition-colors">取消</button>
          <button onClick={onConfirm} className="px-4 py-2 bg-[#E06C6C] text-white rounded-lg font-medium hover:bg-[#C95A5A] transition-colors">{confirmText}</button>
        </div>
      </div>
    </div>
  );
}

export function AlertModal({ title = '提示', message, onClose }: { title?: string, message: string, onClose: () => void }) {
  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-[2px] z-[100] flex items-center justify-center p-6">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-sm overflow-hidden border border-[#E5E1D5]">
        <div className="p-6">
          <h3 className="text-lg font-bold text-[#4A4A3A] mb-2">{title}</h3>
          <p className="text-[#8A8475] whitespace-pre-wrap">{message}</p>
        </div>
        <div className="bg-[#F9F8F4] px-6 py-4 flex justify-end border-t border-[#E5E1D5]">
          <button onClick={onClose} className="px-6 py-2 bg-[#5A5A40] text-white rounded-lg font-medium hover:bg-[#4A4A3A] transition-colors">確定</button>
        </div>
      </div>
    </div>
  );
}
