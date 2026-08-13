<?php
// app/Models/ServiceSubItem.php
namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ServiceSubItem extends Model
{
    use HasFactory;

    protected $fillable = [
        'service_id', 'title', 'description', 'icon', 'link'
    ];

    public function service()
    {
        return $this->belongsTo(Service::class);
    }
}
