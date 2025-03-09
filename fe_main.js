const db = new sqlite3.Database('./db/celldb.db', sqlite3.OPEN_READWRITE, (err)=>{
    if (err)
    {
        return console.error('Error opening SQLite database:', err);
    } 
    else
    {
        console.log('SQLite database connected');
    }
})


/*
function changeRes(event)
{
    const iidd = event.target.closest('tr').childNodes
    return iidd[1].innerText;
}

document.addEventListener('DOMContentLoaded', function() {
    const statusElements = document.querySelectorAll('select[name="status"]'); // Select all status dropdowns
    statusElements.forEach(status => {
        status.addEventListener('change', function(event)
        {
            const newlem = changeRes(event)
            console.log("WHERE'S OMNI MAN GRSHE GRSHE GRSHE " + newlem);
            fetch(`/${aid}/admin_menu/manage_students`,
                {
                    method: 'POST',
                    body: JSON.stringify({newlem})
                }
            )
            
        }); // Listen for 'change' events
        
    });
}); */