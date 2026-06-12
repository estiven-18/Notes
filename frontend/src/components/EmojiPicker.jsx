import { useState, useRef, useEffect } from "react";
import EmojiPickerReact, { EmojiStyle } from "emoji-picker-react";

const EmojiPicker = ({ currentEmoji, onSelect }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return;
    const handleClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  if (!currentEmoji) {
    return (
      <div className="emoji-wrapper-empty" ref={ref}>
        <button
          className="emoji-add-btn"
          onClick={(e) => {
            e.stopPropagation();
            setOpen(true);
          }}
          t
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" width="20" height="20">
            <path stroke-linecap="round" stroke-linejoin="round" d="M15.182 15.182a4.5 4.5 0 0 1-6.364 0M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0ZM9.75 9.75c0 .414-.168.75-.375.75S9 10.164 9 9.75 9.168 9 9.375 9s.375.336.375.75Zm-.375 0h.008v.015h-.008V9.75Zm5.625 0c0 .414-.168.75-.375.75s-.375-.336-.375-.75.168-.75.375-.75.375.336.375.75Zm-.375 0h.008v.015h-.008V9.75Z" />
          </svg>
          Agregar emoji
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
        onClick={(e) => {
          e.stopPropagation();
          setOpen(!open);
        }}
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
              onSelect("");
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
