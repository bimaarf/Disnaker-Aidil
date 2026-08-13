<?php

namespace App\Http\Controllers;

use App\Models\Tweets;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class ProfileController extends Controller
{
    public function view(Request $request, $username)
    {
        // Find the user based on the username
        $user = User::where('name', $username)->first();
        $perPage = $request->input('perPage', 10);

        if (!$user) {
            return response()->json(['error' => 'User not found'], 404);
        }

        $userArray = [
            'username' => $user->name,
            'avatar' => $user->avatar,
            'verified_type' => $user->roles[0]->name === 'administrator' ? 'red' : ($user->roles[0]->name === 'member' ? 'blue' : ''),

            'created' => $user->created_at,
        ];
        $tweets = Tweets::join('users', 'users.name', 'tb_tweets.username')
            ->join('role_user', 'role_user.user_id', 'users.id')
            ->join('roles', 'roles.id', 'role_user.role_id')
            ->where('tb_tweets.username', $username)
            ->where('tb_tweets.sts_tweets', 'true')
            ->orderBy('id', 'DESC')
            ->paginate($perPage, [
                'tb_tweets.id',
                'tb_tweets.key',
                'tb_tweets.username',
                'tb_tweets.tweet',
                'tb_tweets.files',
                'tb_tweets.sts_comments',
                'tb_tweets.sts_tweets',
                'roles.display_name'
            ]);


        // Define an array to store tweet data

        $tweets_temp = $tweets->map(function ($tweet) {
            return [
                'id' => $tweet->id,
                'username' => $tweet->username,
                'key' => $tweet->key,
                'tweet' => $tweet->tweet,
                'files' => $tweet->files,
                's_comments' => $tweet->sts_comments,
                's_tweets' => $tweet->sts_tweets,
                's_accounts' => $tweet->display_name,
            ];
        });
        return [
            'user' => $userArray,
            'tweets' => $tweets_temp,
            'pagination' => [
                'current_page' => $tweets->currentPage(),
                'per_page' => $perPage,
                'total' => $tweets->total(),
            ],
        ];
    }
}
