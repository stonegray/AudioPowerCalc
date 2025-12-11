import ConnectionNode from '../ConnectionNode';

export default function ConnectionNodeExample() {
  return (
    <div className="flex gap-16 items-center p-8">
      <div className="relative bg-card border rounded-md p-4 pr-6">
        <span className="text-sm">Output Node (Disconnected)</span>
        <ConnectionNode
          id="node1"
          type="output"
          position="right"
          onClick={(id) => console.log('Clicked node:', id)}
        />
      </div>
      
      <div className="relative bg-card border rounded-md p-4 pl-6">
        <span className="text-sm">Input Node (Connected)</span>
        <ConnectionNode
          id="node2"
          type="input"
          position="left"
          connected
          color="#3b82f6"
          onClick={(id) => console.log('Clicked node:', id)}
        />
      </div>

      <div className="relative bg-card border rounded-md p-4 pr-6">
        <span className="text-sm">With Label</span>
        <ConnectionNode
          id="node3"
          type="output"
          position="right"
          label="Ch 1"
          onClick={(id) => console.log('Clicked node:', id)}
        />
      </div>
    </div>
  );
}
