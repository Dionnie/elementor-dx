1. Find Default Kit ID:
   1.1 Database > wp_options > elementor_active_kit : look for post_id e.g.6

2. wp_postmeta find where post_id = 6 and meta_key =\_elementor_page_settings

saw the value, I find it disorganized and congusing a:54:{s:13:"system*colors";a:4:{i:0;a:3:{s:3:"\_id";s:7:"primary";s:5:"title";s:7:"PrimaThat exact feeling is completely normal! What you are looking at is a serialized PHP array.When data structures are nested and complex, WordPress turns them into a single string of text so they can be squeezed into a single database row. The letters and numbers like a:54, s:13, and i:0 are data markers telling the server exactly how to rebuild the data later.Deconstructing the "Confusing" CodeHere is exactly what that text means:a:54: An Array containing 54 total settings.s:13:"system_colors": A String that is 13 characters long (s-y-s-t-e-m-*-c-o-l-o-r-s), acting as the setting name.a:4: Another Array nested inside containing your 4 primary system colors.i:0: Integer 0, meaning the very first color slot in the list.s:3:"\_id";s:7:"primary": A key named \_id (3 characters) with the value primary (7 characters).Making It Readable (The Clean Version)When WordPress parses that raw database string using PHP, it converts it into a clean, human-readable structure. Here is what your specific snippet looks like once it is unpacked:json[
"system_colors" => [
0 => [
"_id" => "primary",
"title" => "Primary",
"color" => "#6ec1e4" // Your actual hex code lives here
],
1 => [
"_id" => "secondary",
"title" => "Secondary",
"color" => "#54595f"
]
]
]
Use code with caution.The Safest Way to Read and Edit ThisNever try to edit that raw database text directly by hand. If you change a hex color from 7 characters (e.g., #ffffff) to 4 characters (e.g., #000) without manually changing the string length prefix (s:7 to s:4), the entire site setting file will corrupt, break, and reset your design.Instead, let PHP handle the messy encoding for you using a simple trick:php// 1. Pull the ugly database string
$raw_data = get_post_meta( $kit_id, '\_elementor_page_settings', true );

// 2. Change the value safely in clean code
$raw_data['system_colors'][0]['color'] = '#ff0000'; // Changes primary color to Red

// 3. Save it. WordPress automatically serializes it back into the ugly string format.
update_post_meta( $kit_id, '_elementor_page_settings', $raw_data );
Use code with caution.If you want, I can give you a script to:Convert your entire ugly string into a readable JSON format so you can view it easilyShow you how to target a specific text or font setting inside that massive arrayYou said: is there a way to beatifully reverse it from being single string of textYes, you can easily reverse that raw text into a beautiful, human-readable format. Because it is a PHP-serialized string, you cannot just use a standard online JSON formatter without converting it first.Here are the two best ways to turn that ugly text into clean, structured code.Method 1: The Quick Online Way (No Code Required)If you just want to paste the text and see what is inside right now:Copy the full, ugly text string from your database.Go to a free online tool like wphph.com or unserialize.com.Paste your text into the box and click Unserialize.It will immediately format it into a neat, expandable tree structure.Method 2: The WordPress Way (Print to Screen)If you want to view it directly on your website while developing, you can use WordPress's built-in formatting tools. Add this temporary code snippet to your theme's functions.php file or run it via a code runner plugin:php// 1. Fetch the active kit ID
$kit_id = get_option( 'elementor_active_kit' );

if ( $kit_id ) {
// 2. Fetch the data (WordPress automatically reverses/unserializes it for you!)
$clean_array = get_post_meta( $kit_id, '\_elementor_page_settings', true );

    // 3. Print it wrapped in HTML <pre> tags so it looks beautiful
    echo '<pre style="background:#222; color:#fff; padding:20px; text-align:left; direction:ltr; max-height:500px; overflow:scroll;">';
    print_r( $clean_array );
    echo '</pre>';
    die(); // Stops the rest of the page from loading so you can read cleanly

}
Use code with caution.Method 3: Convert it to Clean JSONIf you prefer standard JSON format (which you can easily read or use in other programming languages), you can unpack it and convert it using this native PHP command:php$kit_id = get_option( 'elementor_active_kit' );
$clean_array = get_post_meta( $kit_id, '\_elementor_page_settings', true );

// Convert the unpacked data into pretty-printed JSON
$beautiful_json = json_encode( $clean_array, JSON_PRETTY_PRINT );

echo '<pre>' . esc_html( $beautiful_json ) . '</pre>';
Use code with caution.Once run, your confusing data will instantly turn into a perfectly indented, readable list where you can easily find tags like "system_colors", "container_width", and "typography".If you'd like, I can show you how to:Write a script to export this clean JSON into a downloadable fileLocate a specific nested design element within the newly cleaned layout
