import AddEquipmentButton from '../AddEquipmentButton';

export default function AddEquipmentButtonExample() {
  return (
    <div className="max-w-xs p-4 space-y-4">
      <AddEquipmentButton
        label="Add Generator"
        onClick={() => console.log('Add generator clicked')}
        testId="button-add-generator"
      />
      <AddEquipmentButton
        label="Add Amplifier"
        onClick={() => console.log('Add amplifier clicked')}
        variant="secondary"
        testId="button-add-amplifier"
      />
    </div>
  );
}
