import React from 'react';
import { Image as ImageIcon, Upload } from 'lucide-react';
import { LabelElement } from '../../types/model';
import { InspectorSection } from '../ui/InspectorSection';

interface ImageSectionProps {
  kind: Extract<LabelElement['kind'], { type: 'image' }>;
  onChangeKind: (kind: LabelElement['kind']) => void;
  onSetAspectLock: (locked: boolean) => void;
}

export const ImageSection: React.FC<ImageSectionProps> = ({
  kind,
  onChangeKind,
  onSetAspectLock,
}) => {
  const handleReplaceImage = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = () => {
          onChangeKind({ ...kind, src: reader.result as string });
        };
        reader.readAsDataURL(file);
      }
    };
    input.click();
  };

  return (
    <InspectorSection title="图片设置 (Image)" icon={<ImageIcon className="w-3.5 h-3.5" />}>
      <div className="space-y-2.5">
        <label className="flex items-center gap-2 text-slate-700 cursor-pointer text-xs">
          <input
            type="checkbox"
            checked={kind.aspectRatioLock}
            onChange={(e) => {
              onChangeKind({ ...kind, aspectRatioLock: e.target.checked });
              onSetAspectLock(e.target.checked);
            }}
            className="rounded text-[#0066FF]"
          />
          <span>锁定原始纵横比 (Lock Aspect Ratio)</span>
        </label>

        <button
          type="button"
          onClick={handleReplaceImage}
          className="w-full py-1.5 px-3 bg-white border border-slate-200 hover:border-[#0066FF]/60 hover:bg-blue-50/40 rounded text-xs font-medium text-slate-700 flex items-center justify-center gap-1.5 transition-colors"
        >
          <Upload className="w-3.5 h-3.5 text-slate-500" />
          <span>替换本地图片...</span>
        </button>
      </div>
    </InspectorSection>
  );
};
