import React, { useState } from "react";
import ReusableDropdown from "../components/reusableDropdown";
import { useDrawer } from "../contexts/DrawerContext";
import { MantenedorType, type MantenedorBase } from "../types/mantenedores";

const Dashboard: React.FC = () => {
  const [selectedContainer, setSelectedContainer] = useState<MantenedorBase | null>(null);
  const [selectedVessel, setSelectedVessel] = useState<MantenedorBase | null>(null);
  const { openDrawer } = useDrawer();

  // Handler for when user wants to create a new item
  const handleCreateNew = (type: MantenedorType) => {
    openDrawer(`mantenedor-${type}`, { type });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600">Here you can build your main dashboard for the project</p>
      </div>

      {/* Example dropdowns using the mantenedores system */}
      <div className="max-w-md space-y-4">
        <div className="p-4 bg-gray-50 rounded-lg">
          <h2 className="text-lg font-semibold mb-4">Mantenedores Demo</h2>
          
          <div className="space-y-4">
            <ReusableDropdown
              type={MantenedorType.CONTAINER}
              label="Select Container"
              value={selectedContainer}
              onChange={setSelectedContainer}
              onCreateNew={handleCreateNew}
              placeholder="Choose a container..."
            />

            <ReusableDropdown
              type={MantenedorType.VESSEL}
              label="Select Vessel"
              value={selectedVessel}
              onChange={setSelectedVessel}
              onCreateNew={handleCreateNew}
              placeholder="Choose a vessel..."
            />
          </div>

          {/* Show selected values */}
          <div className="mt-4 pt-4 border-t border-gray-200">
            <h3 className="text-sm font-medium text-gray-700 mb-2">Selected Values:</h3>
            <p className="text-sm text-gray-600">
              Container: {selectedContainer?.name || 'None'}
            </p>
            <p className="text-sm text-gray-600">
              Vessel: {selectedVessel?.name || 'None'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
