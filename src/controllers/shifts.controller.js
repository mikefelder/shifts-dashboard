/**
 * Get formatted shifts data with grouped shifts and referenced objects
 */
exports.getWhosOnData = async (req, res) => {
  try {
    const forceSync = req.query.forceSync === 'true';
    const workgroupId = req.query.workgroup;
    
    console.log(`Getting Who's On data. Force sync: ${forceSync}, Workgroup: ${workgroupId || 'All'}`);
    
    const cachedData = await cacheService.getWhosOnData();
    const currentTime = new Date();
    
    // Decide if we should use cached data or get fresh data
    let whosOnData;
    let isFreshData = false;
    
    if (forceSync || !cachedData || !cachedData.result) {
      console.log('Getting fresh data from Shiftboard API...');
      whosOnData = await shiftboardService.getWhosOnData();
      isFreshData = true;
      
      // Store this in the cache for future requests
      if (whosOnData && whosOnData.result) {
        await cacheService.setWhosOnData(whosOnData);
        await cacheService.setLastSyncTime(currentTime);
      }
    } else {
      console.log('Using cached data...');
      whosOnData = cachedData;
    }
    
    if (!whosOnData || !whosOnData.result) {
      return res.status(500).json({ message: 'Failed to retrieve shift data' });
    }
    
    // Ensure all account objects have the mobile_phone field as required by the client
    if (whosOnData.result.referenced_objects && 
        Array.isArray(whosOnData.result.referenced_objects.account)) {
      whosOnData.result.referenced_objects.account.forEach(account => {
        // Ensure mobile_phone exists - use phone as fallback if needed
        if (!account.mobile_phone && account.phone) {
          console.log(`Setting mobile_phone from phone for account ${account.id}`);
          account.mobile_phone = account.phone;
        } else if (!account.mobile_phone) {
          account.mobile_phone = '';
        }
        
        // Ensure screen_name is set - use first_name + last_name if needed
        if (!account.screen_name && account.first_name && account.last_name) {
          account.screen_name = `${account.first_name} ${account.last_name}`;
        }
      });
      
      // Log a sample account to verify structure matches expectations
      const sampleAccount = whosOnData.result.referenced_objects.account[0];
      if (sampleAccount) {
        console.log('Sample account data (verify structure):', {
          id: sampleAccount.id,
          external_id: sampleAccount.external_id, 
          name: sampleAccount.screen_name,
          mobile_phone: sampleAccount.mobile_phone
        });
      }
    }
    
    // Filter by workgroup if specified
    let processedData = whosOnData;
    if (workgroupId && processedData.result && Array.isArray(processedData.result.shifts)) {
      processedData = {
        ...processedData,
        result: {
          ...processedData.result,
          shifts: processedData.result.shifts.filter(shift => shift.workgroup === workgroupId)
        }
      };
    }
    
    // Add freshness flag to indicate if this came from API or cache
    const responseData = {
      ...processedData,
      isFreshData
    };
    
    return res.json(responseData);
  } catch (error) {
    console.error('Error fetching Who\'s On data:', error);
    return res.status(500).json({ message: 'Error fetching shift data', error: error.message });
  }
};

// ...existing code...
