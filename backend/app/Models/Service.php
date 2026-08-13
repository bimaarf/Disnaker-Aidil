<?php
// app/Models/Service.php
namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Service extends Model
{
    use HasFactory;
    protected $table = 'services';
    protected $fillable = [
        'title', 'description', 'icon', 'color', 'link'
    ];

    public function subItems()
    {
        return $this->hasMany(ServiceSubItem::class);
    }
}
