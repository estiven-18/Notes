import { useState, useRef, useEffect } from 'react';
import EmojiPickerReact, { EmojiStyle } from 'emoji-picker-react';

const EmojiPicker = ({ currentEmoji, onSelect }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return;
    const handleClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  if (!currentEmoji) {
    return (
      <div className="emoji-wrapper-empty" ref={ref}>
        <button
          className="emoji-add-btn"
          onClick={(e) => { e.stopPropagation(); setOpen(true); }}
          title="Añadir emoji"
        >
          Add icon
        </button>
        {open && (
          <div className="emoji-popover">
            <EmojiPickerReact
              onEmojiClick={(emojiData) => {
                onSelect(emojiData.emoji);
                setOpen(false);
              }}
              emojiStyle={EmojiStyle.NATIVE}
              skinTonesDisabled
              searchPlaceholder="Buscar emoji..."
              width="100%"
              height={350}
            />
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="emoji-picker-wrapper" ref={ref}>
      <button
        className="emoji-trigger"
        onClick={(e) => { e.stopPropagation(); setOpen(!open); }}
        title="Cambiar emoji"
      >
        {currentEmoji}
      </button>

      {open && (
        <div className="emoji-popover">
          <EmojiPickerReact
            onEmojiClick={(emojiData) => {
              onSelect(emojiData.emoji);
              setOpen(false);
            }}
            emojiStyle={EmojiStyle.NATIVE}
            skinTonesDisabled
            searchPlaceholder="Buscar emoji..."
            width="100%"
            height={350}
          />
          <button
            className="emoji-remove"
            onClick={(e) => {
              e.stopPropagation();
              onSelect('');
              setOpen(false);
            }}
          >
            Quitar emoji
          </button>
        </div>
      )}
    </div>
  );
};

export default EmojiPicker;