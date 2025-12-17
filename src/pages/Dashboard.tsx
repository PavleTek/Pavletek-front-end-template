import React, { useState } from "react";
import ReusableDropdown from "../components/reusableDropdown";

const Dashboard: React.FC = () => {
  const [selectedItem, setSelectedItem] = useState<{ id?: number | string; name: string; [key: string]: any } | null>(null);

  // Example items - in real usage, these would come from API or props
  const exampleItems = [
    { id: 1, name: "Leslie Alexander" },
    { id: 2, name: "Pavle Markovic" },
    { id: 3, name: "Michel Berney" },
    { id: 4, name: "Lucas Berney" },
    { id: 5, name: "Milan Martinic" },
    { id: 6, name: "Peter Languila" },
    { id: 7, name: "Leonardo Benetty" },
    { id: 8, name: "Marco Aurelio" },
    { id: 9, name: "Greater Alexander" },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
      <p>Here you can build your main dashboard for the project</p>
      <div className="max-w-2xs">
        <ReusableDropdown
          items={exampleItems}
          label="Assigned to"
          value={selectedItem}
          onChange={setSelectedItem}
          drawerId="default"
        />
      </div>
    </div>
  );
};

export default Dashboard;
