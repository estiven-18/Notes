import { useState, useRef, useEffect } from "react";
import EmojiPickerReact, { EmojiStyle, Categories } from "emoji-picker-react";

const emojiCategories = [
  { category: Categories.SUGGESTED, name: "Usados recientemente" },
  { category: Categories.SMILEYS_PEOPLE, name: "Caras y gente" },
  { category: Categories.ANIMALS_NATURE, name: "Animales y naturaleza" },
  { category: Categories.FOOD_DRINK, name: "Comida y bebida" },
  { category: Categories.TRAVEL_PLACES, name: "Viajes y lugares" },
  { category: Categories.ACTIVITIES, name: "Actividades" },
  { category: Categories.OBJECTS, name: "Objetos" },
  { category: Categories.SYMBOLS, name: "Símbolos" },
  { category: Categories.FLAGS, name: "Banderas" },
];

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
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
            <path fillRule="evenodd" d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25Zm-2.625 6c-.54 0-.828.419-.936.634a1.96 1.96 0 0 0-.189.866c0 .298.059.605.189.866.108.215.395.634.936.634.54 0 .828-.419.936-.634.13-.26.189-.568.189-.866 0-.298-.059-.605-.189-.866-.108-.215-.395-.634-.936-.634Zm4.314.634c.108-.215.395-.634.936-.634.54 0 .828.419.936.634.13.26.189.568.189.866 0 .298-.059.605-.189.866-.108.215-.395.634-.936.634-.54 0-.828-.419-.936-.634a1.96 1.96 0 0 1-.189-.866c0-.298.059-.605.189-.866Zm2.023 6.828a.75.75 0 1 0-1.06-1.06 3.75 3.75 0 0 1-5.304 0 .75.75 0 0 0-1.06 1.06 5.25 5.25 0 0 0 7.424 0Z" clipRule="evenodd" />
          </svg>
          Agregar un ícono
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
              categories={emojiCategories}
              suggestedEmojisMode={null}
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
            categories={emojiCategories}
            suggestedEmojisMode={null}
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
