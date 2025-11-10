const fetchLeads = async () => {
  try {
    const response = await fetch(
      "https://dh9e7lxecq73l.cloudfront.net/public/external/check2.php?testing=2&callback=?&user_id=623910&api_key=525aedb31fa76c26997f25d2b15e501f&s1=&s2=",
      {
        method: "GET",
        mode: "no-cors",
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const jsonp = await response.text();
    console.log("JSONP Response:", jsonp);

    const jsonData = jsonp.slice(2, -2);
    const data = JSON.parse(jsonData);
    if (data && data.length > 0) {
      console.log(`Found ${data.length} completed lead(s).`);
      return data;
    } else {
      console.log("No leads were found.");
      return [];
    }
  } catch (error) {
    console.error("Error fetching leads:", error);
    return [];
  }
};

export default fetchLeads;
