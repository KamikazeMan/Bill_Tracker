const { useState, useEffect } = React;

// Icon component wrapper for Lucide icons
const Icon = ({ name, size = 20, className = "" }) => {
  return <i className={`lucide-${name} ${className}`} style={{ fontSize: size }}></i>;
};

const BillTracker = () => {
  const [bills, setBills] = useState([]);
  const [currentWeek, setCurrentWeek] = useState(new Date());
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);
  const [newBill, setNewBill] = useState({ name: '', amount: '', date: '' });
  const [showCustomBill, setShowCustomBill] = useState(false);
  const [customBillName, setCustomBillName] = useState('');
  const [selectedBillToDelete, setSelectedBillToDelete] = useState('');
  const [quickAddText, setQuickAddText] = useState('');
  const [billTypes, setBillTypes] = useState([
    'Electric Bill',
    'Truck note',
    'Water',
    'Internet',
    'Garbage',
    'Phone',
    'Insurance',
    'IRS',
    'Shed',
    'Couch Lambert',
    'Upstart',
    'Hulu',
    'Netflix',
    'Walmart+'
  ]);

  // Load bills from localStorage on mount
  useEffect(() => {
    const savedBills = localStorage.getItem('billTrackerData');
    if (savedBills) {
      setBills(JSON.parse(savedBills));
    }
    
    const savedBillTypes = localStorage.getItem('billTrackerTypes');
    if (savedBillTypes) {
      setBillTypes(JSON.parse(savedBillTypes));
    }
  }, []);

  // Save bills to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('billTrackerData', JSON.stringify(bills));
  }, [bills]);

  // Save bill types to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('billTrackerTypes', JSON.stringify(billTypes));
  }, [billTypes]);

  // Get start and end of current week
  const getWeekDates = (date) => {
    const start = new Date(date);
    start.setDate(start.getDate() - start.getDay());
    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    return { start, end };
  };

  // Format date for display
  const formatDate = (date) => {
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  // Get bills for current week
  const getWeeklyBills = () => {
    const { start, end } = getWeekDates(currentWeek);
    return bills.filter(bill => {
      const billDate = new Date(bill.date + 'T00:00:00');
      const weekStart = new Date(start.toDateString());
      const weekEnd = new Date(end.toDateString());
      weekEnd.setHours(23, 59, 59, 999);
      return billDate >= weekStart && billDate <= weekEnd;
    });
  };

  // Calculate weekly total
  const getWeeklyTotal = () => {
    const weeklyBills = getWeeklyBills();
    if (weeklyBills.length === 0) return '0.00';
    
    const total = weeklyBills.reduce((sum, bill) => {
      const amount = parseFloat(bill.amount) || 0;
      return sum + amount;
    }, 0);
    
    return total.toFixed(2);
  };

  // Add new bill
  const addBill = () => {
    if (newBill.name && newBill.amount && newBill.date) {
      const billToAdd = {
        id: Date.now(),
        name: newBill.name,
        amount: parseFloat(newBill.amount),
        date: newBill.date
      };
      setBills(prevBills => [...prevBills, billToAdd]);
      setNewBill({ name: '', amount: '', date: '' });
      setShowAddForm(false);
      setShowCustomBill(false);
    } else {
      alert('Please fill in all fields');
    }
  };

  // Delete bill
  const deleteBill = (id) => {
    setBills(bills.filter(bill => bill.id !== id));
  };

  // Navigate weeks
  const previousWeek = () => {
    const prev = new Date(currentWeek);
    prev.setDate(prev.getDate() - 7);
    setCurrentWeek(prev);
  };

  const nextWeek = () => {
    const next = new Date(currentWeek);
    next.setDate(next.getDate() + 7);
    setCurrentWeek(next);
  };

  // Generate week days
  const getWeekDays = () => {
    const { start } = getWeekDates(currentWeek);
    const days = [];
    for (let i = 0; i < 7; i++) {
      const day = new Date(start);
      day.setDate(start.getDate() + i);
      days.push(day);
    }
    return days;
  };

  // Get bills for specific date
  const getBillsForDate = (date) => {
    const dateStr = date.toISOString().split('T')[0];
    return bills.filter(bill => bill.date === dateStr);
  };

  // Calculate daily total for calendar display
  const getDayTotal = (dayBills) => {
    if (dayBills.length === 0) return 0;
    return dayBills.reduce((sum, bill) => {
      const amount = typeof bill.amount === 'string' ? parseFloat(bill.amount) : bill.amount;
      return sum + (amount || 0);
    }, 0);
  };

  // Add new bill type
  const addBillType = () => {
    if (customBillName && !billTypes.includes(customBillName)) {
      const newTypes = [...billTypes, customBillName];
      setBillTypes(newTypes);
      setNewBill({ ...newBill, name: customBillName });
      setCustomBillName('');
      setShowCustomBill(false);
    }
  };

  // Delete bill type
  const deleteBillType = (typeToDelete) => {
    setBillTypes(billTypes.filter(type => type !== typeToDelete));
  };

  // Quick add parser
  const handleQuickAdd = () => {
    const parts = quickAddText.trim().split(' ');
    if (parts.length < 2) {
      alert('Please enter in format: "Electric 150" or "Water 45.50"');
      return;
    }
    
    // Extract amount (last part that looks like a number)
    let amount = '';
    let billName = '';
    
    // Find the number in the text
    for (let i = parts.length - 1; i >= 0; i--) {
      if (parts[i].match(/^\d+\.?\d*$/)) {
        amount = parts[i];
        billName = parts.slice(0, i).join(' ');
        break;
      }
    }
    
    if (!amount || !billName) {
      alert('Could not parse bill. Try format: "Electric 150"');
      return;
    }
    
    // Find matching bill type
    const matchedBill = billTypes.find(bill => 
      bill.toLowerCase().includes(billName.toLowerCase()) || 
      billName.toLowerCase().includes(bill.toLowerCase().split(' ')[0])
    );
    
    if (matchedBill || confirm(`"${billName}" is not in your list. Add it as new?`)) {
      const finalBillName = matchedBill || billName;
      if (!matchedBill) {
        setBillTypes([...billTypes, finalBillName]);
      }
      
      const billToAdd = {
        id: Date.now(),
        name: finalBillName,
        amount: parseFloat(amount),
        date: new Date().toISOString().split('T')[0]
      };
      
      setBills(prevBills => [...prevBills, billToAdd]);
      setQuickAddText('');
      alert(`Added: ${finalBillName} - $${amount}`);
    }
  };

  // Export data as JSON
  const exportData = () => {
    const exportObject = {
      bills: bills,
      billTypes: billTypes,
      exportDate: new Date().toISOString(),
      version: '1.0'
    };
    const dataStr = JSON.stringify(exportObject, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    const exportFileDefaultName = `bills-backup-${new Date().toISOString().split('T')[0]}.json`;
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  // Import data from JSON file
  const importData = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const importedData = JSON.parse(e.target.result);
        
        // Check if it's valid data
        if (importedData.bills && importedData.billTypes) {
          if (confirm('This will replace all your current bills and bill types. Continue?')) {
            // Ensure amounts are numbers when importing
            const fixedBills = importedData.bills.map(bill => ({
              ...bill,
              amount: typeof bill.amount === 'string' ? parseFloat(bill.amount) : bill.amount
            }));
            setBills(fixedBills);
            setBillTypes(importedData.billTypes);
            alert('Data imported successfully!');
          }
        } else {
          alert('Invalid file format. Please select a valid Bill Tracker backup file.');
        }
      } catch (error) {
        alert('Error reading file. Please make sure it\'s a valid backup file.');
      }
    };
    reader.readAsText(file);
  };

  // Share data via Web Share API or download file
  const shareData = async () => {
    const exportObject = {
      bills: bills,
      billTypes: billTypes,
      exportDate: new Date().toISOString(),
      version: '1.0'
    };
    const dataStr = JSON.stringify(exportObject, null, 2);
    
    // Create a blob and download link
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    // Try Web Share API first (works on mobile with file sharing)
    if (navigator.share && navigator.canShare && navigator.canShare({ files: [new File([blob], 'bills.json')] })) {
      try {
        const file = new File([blob], `bills-${new Date().toISOString().split('T')[0]}.json`, {
          type: 'application/json'
        });
        
        await navigator.share({
          title: 'Bill Tracker Backup',
          text: 'My bills backup file',
          files: [file]
        });
        URL.revokeObjectURL(url);
        return;
      } catch (err) {
        console.log('Share failed, falling back to download');
      }
    }
    
    // Fallback to download
    const downloadLink = document.createElement('a');
    downloadLink.href = url;
    downloadLink.download = `bills-share-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
    URL.revokeObjectURL(url);
    
    alert('File downloaded! You can now share this file via email, WhatsApp, or any messaging app.');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-2xl shadow-xl p-6 mb-6">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-2">
              <Icon name="dollar-sign" className="text-green-600" />
              Bill Tracker
            </h1>
            <div className="flex gap-2">
              <button
                onClick={shareData}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                title="Share data"
              >
                <Icon name="share-2" size={20} />
                <span className="hidden sm:inline">Share</span>
              </button>
              <button
                onClick={exportData}
                className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                title="Export backup"
              >
                <Icon name="download" size={20} />
                <span className="hidden sm:inline">Export</span>
              </button>
              <label className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors cursor-pointer"
                title="Import backup">
                <Icon name="upload" size={20} />
                <span className="hidden sm:inline">Import</span>
                <input
                  type="file"
                  accept=".json"
                  onChange={importData}
                  className="hidden"
                />
              </label>
            </div>
          </div>

          {/* Week Navigation */}
          <div className="flex items-center justify-between mb-6 bg-indigo-50 rounded-lg p-4">
            <button
              onClick={previousWeek}
              className="p-2 hover:bg-indigo-200 rounded-lg transition-colors"
            >
              <Icon name="chevron-left" />
            </button>
            <div className="text-center">
              <h2 className="text-xl font-semibold text-gray-800">
                {formatDate(getWeekDates(currentWeek).start)} - {formatDate(getWeekDates(currentWeek).end)}
              </h2>
              <p className="text-2xl font-bold text-green-600 mt-2">
                Total: ${getWeeklyTotal()}
              </p>
              <p className="text-sm text-gray-600">
                {getWeeklyBills().length} bills this week
              </p>
            </div>
            <button
              onClick={nextWeek}
              className="p-2 hover:bg-indigo-200 rounded-lg transition-colors"
            >
              <Icon name="chevron-right" />
            </button>
          </div>

          {/* Quick Add Section */}
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
            <h3 className="text-sm font-semibold text-green-800 mb-2">Quick Add Bill</h3>
            <div className="flex gap-2">
              <input
                type="text"
                value={quickAddText}
                onChange={(e) => setQuickAddText(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    handleQuickAdd();
                  }
                }}
                placeholder="Type: Electric 150 or Water 45.50"
                className="flex-1 px-3 py-2 border border-green-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              />
              <button
                onClick={handleQuickAdd}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                Quick Add
              </button>
            </div>
            <p className="text-xs text-green-700 mt-1">Format: [bill name] [amount]</p>
          </div>
          
          {/* Instructions */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4 text-sm">
            <p className="text-blue-800">
              <strong>Quick Entry:</strong> Type "Electric 150" and press Enter to quickly add bills for today.
            </p>
          </div>

          {/* Weekly Calendar */}
          <div className="grid grid-cols-7 gap-2 mb-6">
            {getWeekDays().map((day, index) => {
              const dayBills = getBillsForDate(day);
              const isToday = day.toDateString() === new Date().toDateString();
              
              return (
                <div
                  key={index}
                  className={`border rounded-lg p-3 min-h-[120px] cursor-pointer transition-all hover:shadow-md ${
                    isToday ? 'bg-blue-50 border-blue-400' : 'bg-gray-50'
                  }`}
                  onClick={() => {
                    setSelectedDate(day.toISOString().split('T')[0]);
                    setNewBill({ ...newBill, date: day.toISOString().split('T')[0] });
                    setShowAddForm(true);
                  }}
                >
                  <div className="font-semibold text-sm text-gray-700">
                    {day.toLocaleDateString('en-US', { weekday: 'short' })}
                  </div>
                  <div className="text-xs text-gray-500 mb-2">
                    {day.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </div>
                  {dayBills.length > 0 && (
                    <>
                      <div className="text-xs text-gray-600 mb-1">
                        {dayBills.length} bill{dayBills.length > 1 ? 's' : ''}
                      </div>
                      <div className="text-sm font-bold text-green-600">
                        ${getDayTotal(dayBills).toFixed(2)}
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </div>

          {/* Add Bill Button */}
          <button
            onClick={() => {
              setNewBill({ name: '', amount: '', date: new Date().toISOString().split('T')[0] });
              setShowAddForm(true);
            }}
            className="w-full flex items-center justify-center gap-2 bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 transition-colors"
          >
            <Icon name="plus" />
            Add New Bill
          </button>
        </div>

        {/* Bills List */}
        <div className="bg-white rounded-2xl shadow-xl p-6">
          <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <Icon name="calendar" className="text-indigo-600" />
            This Week's Bills
          </h3>
          <div className="space-y-2">
            {getWeeklyBills().length === 0 ? (
              <p className="text-gray-500 text-center py-8">No bills for this week</p>
            ) : (
              getWeeklyBills().map(bill => (
                <div
                  key={bill.id}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div>
                    <p className="font-semibold text-gray-800">{bill.name}</p>
                    <p className="text-sm text-gray-500">
                      {new Date(bill.date).toLocaleDateString('en-US', { 
                        weekday: 'long', 
                        month: 'short', 
                        day: 'numeric' 
                      })}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xl font-bold text-green-600">
                      ${bill.amount.toFixed(2)}
                    </span>
                    <button
                      onClick={() => deleteBill(bill.id)}
                      className="text-red-500 hover:text-red-700 transition-colors"
                    >
                      <Icon name="x" size={20} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Manage Bill Types */}
        <div className="bg-white rounded-2xl shadow-xl p-6 mt-6">
          <h3 className="text-xl font-semibold mb-4">Manage Bill Types</h3>
          
          {/* Add Custom Bill Type */}
          <div className="mb-6">
            <p className="text-sm text-gray-600 mb-2">Add a new bill type:</p>
            <div className="flex gap-2">
              <input
                type="text"
                value={customBillName}
                onChange={(e) => setCustomBillName(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && customBillName.trim()) {
                    if (!billTypes.includes(customBillName.trim())) {
                      setBillTypes([...billTypes, customBillName.trim()]);
                      setCustomBillName('');
                      alert(`Added "${customBillName.trim()}" to bill types`);
                    } else {
                      alert('This bill type already exists');
                    }
                  }
                }}
                placeholder="Enter new bill type (e.g., Car Payment)"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              />
              <button
                onClick={() => {
                  if (customBillName.trim() && !billTypes.includes(customBillName.trim())) {
                    setBillTypes([...billTypes, customBillName.trim()]);
                    setCustomBillName('');
                    alert(`Added "${customBillName.trim()}" to bill types`);
                  } else if (billTypes.includes(customBillName.trim())) {
                    alert('This bill type already exists');
                  }
                }}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                Add Type
              </button>
            </div>
          </div>
          
          {/* Delete Bill Type */}
          <p className="text-sm text-gray-600 mb-4">Select a bill type to delete (for bills you've paid off):</p>
          <div className="flex gap-2">
            <select
              value={selectedBillToDelete}
              onChange={(e) => setSelectedBillToDelete(e.target.value)}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
            >
              <option value="">Select a bill type to delete</option>
              {billTypes.map((type, index) => (
                <option key={index} value={type}>{type}</option>
              ))}
            </select>
            <button
              onClick={() => {
                if (selectedBillToDelete) {
                  if (confirm(`Are you sure you want to delete "${selectedBillToDelete}" from your bill types?`)) {
                    deleteBillType(selectedBillToDelete);
                    setSelectedBillToDelete('');
                  }
                }
              }}
              disabled={!selectedBillToDelete}
              className={`px-4 py-2 rounded-lg transition-colors ${
                selectedBillToDelete 
                  ? 'bg-red-500 text-white hover:bg-red-600' 
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              Delete Selected
            </button>
          </div>
          
          {/* Current Bill Types List */}
          <div className="mt-6">
            <p className="text-sm text-gray-600 mb-2">Current bill types ({billTypes.length}):</p>
            <div className="flex flex-wrap gap-2">
              {billTypes.map((type, index) => (
                <span
                  key={index}
                  className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm"
                >
                  {type}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Instructions for Sharing */}
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 mt-6">
          <h3 className="text-sm font-semibold text-purple-800 mb-2">📱 Use on Multiple Phones</h3>
          <ol className="text-sm text-purple-700 space-y-1">
            <li>1. Click <strong>Share</strong> to send your data via text/email</li>
            <li>2. Click <strong>Export</strong> to download a backup file</li>
            <li>3. Click <strong>Import</strong> on the new phone to load your data</li>
          </ol>
          <p className="text-xs text-purple-600 mt-2">Share this page URL with family to use the same app!</p>
        </div>
      </div>

      {/* Add Bill Modal */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md">
            <h3 className="text-2xl font-semibold mb-4">Add New Bill</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Bill Type
                </label>
                <div className="flex gap-2 mb-2">
                  <select
                    value={newBill.name}
                    onChange={(e) => {
                      if (e.target.value === 'custom') {
                        setShowCustomBill(true);
                        setNewBill({ ...newBill, name: '' });
                      } else {
                        setNewBill({ ...newBill, name: e.target.value });
                      }
                    }}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  >
                    <option value="">Select a bill type</option>
                    {billTypes.map((type, index) => (
                      <option key={index} value={type}>{type}</option>
                    ))}
                    <option value="custom">+ Add Custom Bill</option>
                  </select>
                  {newBill.name && billTypes.includes(newBill.name) && (
                    <button
                      type="button"
                      onClick={() => {
                        if (confirm(`Delete "${newBill.name}" from the list?`)) {
                          deleteBillType(newBill.name);
                          setNewBill({ ...newBill, name: '' });
                        }
                      }}
                      className="px-3 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                    >
                      <Icon name="x" size={20} />
                    </button>
                  )}
                </div>
              </div>
              {showCustomBill && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Custom Bill Name
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={customBillName}
                      onChange={(e) => setCustomBillName(e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                      placeholder="Enter custom bill name"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        if (customBillName) {
                          addBillType();
                        }
                      }}
                      className="px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                    >
                      Add
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowCustomBill(false);
                        setCustomBillName('');
                      }}
                      className="px-3 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Amount
                </label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    step="0.01"
                    value={newBill.amount}
                    onChange={(e) => setNewBill({ ...newBill, amount: e.target.value })}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    placeholder="0.00"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Date
                </label>
                <input
                  type="date"
                  value={newBill.date}
                  onChange={(e) => setNewBill({ ...newBill, date: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={addBill}
                className="flex-1 bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 transition-colors"
              >
                Add Bill
              </button>
              <button
                onClick={() => {
                  setShowAddForm(false);
                  setNewBill({ name: '', amount: '', date: '' });
                  setShowCustomBill(false);
                }}
                className="flex-1 bg-gray-300 text-gray-700 py-2 rounded-lg hover:bg-gray-400 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Render the app
ReactDOM.render(<BillTracker />, document.getElementById('root'));