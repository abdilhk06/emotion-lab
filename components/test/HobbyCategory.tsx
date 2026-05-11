import { HobbyChip } from "@/components/test/HobbyChip";

type HobbyCategoryProps = {
  name: string;
  hobbies: string[];
  selected: Set<string>;
  maxReached: boolean;
  onToggle: (hobby: string) => void;
};

export function HobbyCategory({ name, hobbies, selected, maxReached, onToggle }: HobbyCategoryProps) {
  const selectedInCategory = hobbies.filter((hobby) => selected.has(hobby)).length;

  return (
    <section className="hobbies-category" aria-label={name}>
      <div className="hobbies-cat-header">
        <span>{name}</span>
        <span className="hobbies-cat-count">{selectedInCategory} / {hobbies.length}</span>
      </div>
      <div className="hobbies-chips">
        {hobbies.map((hobby) => {
          const isSelected = selected.has(hobby);
          const isDisabled = maxReached && !isSelected;

          return (
            <HobbyChip
              key={hobby}
              label={hobby}
              isSelected={isSelected}
              isDisabled={isDisabled}
              onToggle={() => onToggle(hobby)}
            />
          );
        })}
      </div>
    </section>
  );
}
